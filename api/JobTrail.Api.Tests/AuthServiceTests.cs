using JobTrail.Api.Contracts.Auth;
using JobTrail.Api.Data;
using JobTrail.Api.Exceptions;
using JobTrail.Api.Models;
using JobTrail.Api.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Time.Testing;
using Microsoft.IdentityModel.JsonWebTokens;

namespace JobTrail.Api.Tests;

public class AuthServiceTests : IDisposable
{
    private readonly AppDbContext db = TestHelpers.CreateDbContext();
    private readonly FakeTimeProvider clock = TestHelpers.CreateClock();
    private readonly AuthService authService;

    private static readonly RegisterRequest Ana = new()
    {
        Email = "  Ana.Fictional@Example.com ",
        Password = "correct-horse-battery",
        DisplayName = " Ana ",
    };

    private static readonly LoginRequest AnaLogin = new() { Email = "ana.fictional@example.com", Password = Ana.Password };

    public AuthServiceTests()
    {
        authService = new AuthService(
            db,
            new PasswordHasher<User>(),
            clock,
            Microsoft.Extensions.Options.Options.Create(TestHelpers.JwtOptions));
    }

    public void Dispose()
    {
        db.Dispose();
    }

    [Fact]
    public async Task Register_StoresNormalizedEmailAndHashedPassword()
    {
        var response = await authService.RegisterAsync(Ana, CancellationToken.None);

        Assert.Equal("ana.fictional@example.com", response.User.Email);
        Assert.Equal("Ana", response.User.DisplayName);

        var user = await db.Users.SingleAsync();
        Assert.Equal("ana.fictional@example.com", user.Email);
        Assert.NotEqual(Ana.Password, user.PasswordHash);
        Assert.Equal(TestHelpers.Now, user.CreatedAt);
    }

    [Fact]
    public async Task Register_SameEmailInAnyCase_Throws409()
    {
        await authService.RegisterAsync(Ana, CancellationToken.None);
        var duplicate = new RegisterRequest { Email = "ANA.FICTIONAL@EXAMPLE.COM", Password = "another-password", DisplayName = "Other" };

        var ex = await Assert.ThrowsAsync<ApiException>(() => authService.RegisterAsync(duplicate, CancellationToken.None));

        Assert.Equal(StatusCodes.Status409Conflict, ex.StatusCode);
        Assert.Equal(1, await db.Users.CountAsync());
    }

    [Fact]
    public async Task Register_InvalidFields_Throws400WithEveryFieldError()
    {
        var invalid = new RegisterRequest { Email = "not-an-email", Password = "short", DisplayName = " " };

        var ex = await Assert.ThrowsAsync<ApiException>(() => authService.RegisterAsync(invalid, CancellationToken.None));

        Assert.Equal(StatusCodes.Status400BadRequest, ex.StatusCode);
        Assert.Equal(["displayName", "email", "password"], ex.Errors!.Keys.Order());
        Assert.Empty(db.Users);
    }

    [Fact]
    public async Task Login_WithCorrectPassword_ReturnsTokenWithUserClaims()
    {
        var registered = await authService.RegisterAsync(Ana, CancellationToken.None);

        var response = await authService.LoginAsync(AnaLogin, CancellationToken.None);

        var token = new JsonWebToken(response.Token);
        Assert.Equal(registered.User.Id.ToString(), token.Subject);
        Assert.Equal("ana.fictional@example.com", token.GetClaim(JwtRegisteredClaimNames.Email).Value);
        Assert.Equal("JobTrail.Tests", token.Issuer);
        Assert.True(Guid.TryParse(token.Id, out _));
    }

    [Fact]
    public async Task Login_TokenExpiresAfterConfiguredMinutes()
    {
        await authService.RegisterAsync(Ana, CancellationToken.None);

        var response = await authService.LoginAsync(AnaLogin, CancellationToken.None);

        var expected = TestHelpers.Now.AddMinutes(TestHelpers.JwtOptions.ExpiryMinutes);
        Assert.Equal(expected, response.ExpiresAt);
        Assert.Equal(expected.UtcDateTime, new JsonWebToken(response.Token).ValidTo);
    }

    [Fact]
    public async Task Login_WithWrongPassword_Throws401()
    {
        await authService.RegisterAsync(Ana, CancellationToken.None);
        var wrong = new LoginRequest { Email = Ana.Email, Password = "wrong-password" };

        var ex = await Assert.ThrowsAsync<ApiException>(() => authService.LoginAsync(wrong, CancellationToken.None));

        Assert.Equal(StatusCodes.Status401Unauthorized, ex.StatusCode);
    }

    [Fact]
    public async Task Login_WithUnknownEmail_Throws401()
    {
        var unknown = new LoginRequest { Email = "nobody@example.com", Password = "whatever-password" };

        var ex = await Assert.ThrowsAsync<ApiException>(() => authService.LoginAsync(unknown, CancellationToken.None));

        Assert.Equal(StatusCodes.Status401Unauthorized, ex.StatusCode);
    }

    [Fact]
    public async Task Login_EmptyFields_Throws400()
    {
        var empty = new LoginRequest();

        var ex = await Assert.ThrowsAsync<ApiException>(() => authService.LoginAsync(empty, CancellationToken.None));

        Assert.Equal(StatusCodes.Status400BadRequest, ex.StatusCode);
        Assert.Equal(["email", "password"], ex.Errors!.Keys.Order());
    }

    [Fact]
    public async Task Logout_RevokesOnlyThatToken()
    {
        var registered = await authService.RegisterAsync(Ana, CancellationToken.None);
        var login = await authService.LoginAsync(AnaLogin, CancellationToken.None);
        var webTokenId = Guid.Parse(new JsonWebToken(registered.Token).Id);
        var extensionTokenId = Guid.Parse(new JsonWebToken(login.Token).Id);

        await authService.LogoutAsync(registered.User.Id, webTokenId, registered.ExpiresAt, CancellationToken.None);

        Assert.True(await authService.IsTokenRevokedAsync(webTokenId, CancellationToken.None));
        Assert.False(await authService.IsTokenRevokedAsync(extensionTokenId, CancellationToken.None));
    }

    [Fact]
    public async Task Logout_DeletesRevokedTokensThatAlreadyExpired()
    {
        var registered = await authService.RegisterAsync(Ana, CancellationToken.None);
        var oldTokenId = Guid.NewGuid();
        await authService.LogoutAsync(registered.User.Id, oldTokenId, TestHelpers.Now.AddMinutes(5), CancellationToken.None);

        clock.Advance(TimeSpan.FromMinutes(10));
        await authService.LogoutAsync(registered.User.Id, Guid.NewGuid(), clock.GetUtcNow().AddMinutes(60), CancellationToken.None);

        Assert.False(await authService.IsTokenRevokedAsync(oldTokenId, CancellationToken.None));
        Assert.Equal(1, await db.RevokedTokens.CountAsync());
    }

    [Fact]
    public async Task GetUser_ReturnsPublicData()
    {
        var registered = await authService.RegisterAsync(Ana, CancellationToken.None);

        var user = await authService.GetUserAsync(registered.User.Id, CancellationToken.None);

        Assert.Equal(new UserResponse(registered.User.Id, "ana.fictional@example.com", "Ana"), user);
    }

    [Fact]
    public async Task GetUser_DeletedAccount_Throws401()
    {
        var ex = await Assert.ThrowsAsync<ApiException>(() => authService.GetUserAsync(Guid.NewGuid(), CancellationToken.None));

        Assert.Equal(StatusCodes.Status401Unauthorized, ex.StatusCode);
    }
}
