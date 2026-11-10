using System.Net.Mail;
using System.Security.Claims;
using System.Text;
using JobTrail.Api.Contracts.Auth;
using JobTrail.Api.Data;
using JobTrail.Api.Exceptions;
using JobTrail.Api.Models;
using JobTrail.Api.Options;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.JsonWebTokens;
using Microsoft.IdentityModel.Tokens;
using Npgsql;

namespace JobTrail.Api.Services;

public class AuthService
{
    #region Consts

    private const int MinPasswordLength = 8;
    private const int MaxEmailLength = 256;
    private const int MaxDisplayNameLength = 100;
    // Verified when the email does not exist, so response time does not reveal which emails have an account.
    private static readonly string DummyPasswordHash = new PasswordHasher<User>().HashPassword(new User(), Guid.NewGuid().ToString());

    #endregion

    #region Constructor

    private readonly AppDbContext _db;
    private readonly IPasswordHasher<User> _passwordHasher;
    private readonly TimeProvider _timeProvider;
    private readonly JwtOptions _jwtOptions;

    public AuthService(
        AppDbContext db,
        IPasswordHasher<User> passwordHasher,
        TimeProvider timeProvider,
        IOptions<JwtOptions> jwtOptions)
    {
        _db = db;
        _passwordHasher = passwordHasher;
        _timeProvider = timeProvider;
        _jwtOptions = jwtOptions.Value;
    }

    #endregion

    #region Query

    public async Task<UserResponse> GetUserAsync(Guid userId, CancellationToken cancellationToken)
    {
        var user = await _db.Users
            .Where(u => u.Id == userId)
            .Select(u => new UserResponse(u.Id, u.Email, u.DisplayName))
            .FirstOrDefaultAsync(cancellationToken);

        return user ?? throw new ApiException(StatusCodes.Status401Unauthorized, "This account no longer exists.");
    }
    #endregion

    #region Setup

    public async Task<AuthResponse> RegisterAsync(RegisterRequest rq, CancellationToken cancellationToken)
    {
        var email = NormalizeEmail(rq.Email);
        await ValidateRegisterAsync(rq, email, cancellationToken);

        var user = new User
        {
            Id = Guid.CreateVersion7(),
            Email = email,
            DisplayName = rq.DisplayName.Trim(),
            CreatedAt = _timeProvider.GetUtcNow(),
        };
        user.PasswordHash = _passwordHasher.HashPassword(user, rq.Password);

        _db.Users.Add(user);
        try
        {
            await _db.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateException ex) when (ex.InnerException is PostgresException { SqlState: PostgresErrorCodes.UniqueViolation })
        {
            // Two sign-ups with the same email at once: the unique index rejects the second one.
            throw EmailTakenException();
        }

        return CreateAuthResponse(user);
    }
    #endregion

    #region Session

    public async Task<AuthResponse> LoginAsync(LoginRequest rq, CancellationToken cancellationToken)
    {
        ValidateLogin(rq);

        var email = NormalizeEmail(rq.Email);
        var user = await _db.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Email == email, cancellationToken);

        var passwordHash = user?.PasswordHash ?? DummyPasswordHash;
        var result = _passwordHasher.VerifyHashedPassword(user ?? new User(), passwordHash, rq.Password);

        if (user is null || result == PasswordVerificationResult.Failed)
        {
            throw new ApiException(StatusCodes.Status401Unauthorized, "Wrong email or password.");
        }

        return CreateAuthResponse(user);
    }

    public async Task LogoutAsync(Guid userId, Guid tokenId, DateTimeOffset tokenExpiresAt, CancellationToken cancellationToken)
    {
        var now = _timeProvider.GetUtcNow();
        var expiredTokens = await _db.RevokedTokens.Where(t => t.ExpiresAt < now).ToListAsync(cancellationToken);
        _db.RevokedTokens.RemoveRange(expiredTokens);

        _db.RevokedTokens.Add(new RevokedToken { Jti = tokenId, UserId = userId, ExpiresAt = tokenExpiresAt });
        await _db.SaveChangesAsync(cancellationToken);
    }
    #endregion

    #region Token

    public async Task<bool> IsTokenRevokedAsync(Guid tokenId, CancellationToken cancellationToken)
    {
        return await _db.RevokedTokens.AnyAsync(t => t.Jti == tokenId, cancellationToken);
    }

    private (string Token, DateTimeOffset ExpiresAt) CreateToken(User user)
    {
        // JWT dates have one-second precision; rounding keeps ExpiresAt equal to the token's "exp".
        var now = DateTimeOffset.FromUnixTimeSeconds(_timeProvider.GetUtcNow().ToUnixTimeSeconds());
        var expiresAt = now.AddMinutes(_jwtOptions.ExpiryMinutes);

        var descriptor = new SecurityTokenDescriptor
        {
            Issuer = _jwtOptions.Issuer,
            Audience = _jwtOptions.Audience,
            Subject = new ClaimsIdentity(
            [
                new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
                new Claim(JwtRegisteredClaimNames.Email, user.Email),
                new Claim(JwtRegisteredClaimNames.Name, user.DisplayName),
                new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
            ]),
            IssuedAt = now.UtcDateTime,
            NotBefore = now.UtcDateTime,
            Expires = expiresAt.UtcDateTime,
            SigningCredentials = new SigningCredentials(
                new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_jwtOptions.Key)),
                SecurityAlgorithms.HmacSha256),
        };

        return (new JsonWebTokenHandler().CreateToken(descriptor), expiresAt);
    }
    #endregion

    #region Validations

    private async Task ValidateRegisterAsync(RegisterRequest rq, string email, CancellationToken cancellationToken)
    {
        var errors = new Dictionary<string, string[]>();

        if (!IsValidEmail(email))
        {
            errors["email"] = ["Enter a valid email."];
        }

        if (string.IsNullOrEmpty(rq.Password) || rq.Password.Length < MinPasswordLength)
        {
            errors["password"] = [$"The password must have at least {MinPasswordLength} characters."];
        }

        if (string.IsNullOrWhiteSpace(rq.DisplayName) || rq.DisplayName.Trim().Length > MaxDisplayNameLength)
        {
            errors["displayName"] = [$"Enter a name of up to {MaxDisplayNameLength} characters."];
        }

        ThrowIfInvalid(errors);

        if (await _db.Users.AnyAsync(u => u.Email == email, cancellationToken))
        {
            throw EmailTakenException();
        }
    }

    private static void ValidateLogin(LoginRequest rq)
    {
        var errors = new Dictionary<string, string[]>();

        if (string.IsNullOrWhiteSpace(rq.Email))
        {
            errors["email"] = ["Enter your email."];
        }

        if (string.IsNullOrEmpty(rq.Password))
        {
            errors["password"] = ["Enter your password."];
        }

        ThrowIfInvalid(errors);
    }
    #endregion

    #region Private Helpers

    private AuthResponse CreateAuthResponse(User user)
    {
        var (token, expiresAt) = CreateToken(user);
        return new AuthResponse(token, expiresAt, new UserResponse(user.Id, user.Email, user.DisplayName));
    }

    private static string NormalizeEmail(string? email)
    {
        return (email ?? string.Empty).Trim().ToLowerInvariant();
    }

    private static bool IsValidEmail(string email)
    {
        return email.Length <= MaxEmailLength
            && MailAddress.TryCreate(email, out var address)
            && address.Address == email;
    }

    private static void ThrowIfInvalid(Dictionary<string, string[]> errors)
    {
        if (errors.Count > 0)
        {
            throw new ApiException(StatusCodes.Status400BadRequest, "Some fields are not valid.", errors);
        }
    }

    private static ApiException EmailTakenException()
    {
        return new ApiException(StatusCodes.Status409Conflict, "This email is already registered.");
    }
    #endregion
}
