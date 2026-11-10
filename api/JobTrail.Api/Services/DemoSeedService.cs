using JobTrail.Api.Data;
using JobTrail.Api.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace JobTrail.Api.Services;

// Demo user to make the app easy to use at the start. Runs on every startup in Development only.
public class DemoSeedService
{
    #region Consts

    public const string DemoEmail = "jobtrail@jobtrail.com";
    public const string DemoPassword = "Password1!";
    public const string DemoDisplayName = "jobtrail";

    #endregion

    #region Constructor

    private readonly AppDbContext _db;
    private readonly IPasswordHasher<User> _passwordHasher;
    private readonly TimeProvider _timeProvider;

    public DemoSeedService(AppDbContext db, IPasswordHasher<User> passwordHasher, TimeProvider timeProvider)
    {
        _db = db;
        _passwordHasher = passwordHasher;
        _timeProvider = timeProvider;
    }

    #endregion

    #region Setup

    public async Task SeedAsync(CancellationToken cancellationToken)
    {
        if (await _db.Users.AnyAsync(u => u.Email == DemoEmail, cancellationToken))
        {
            return;
        }

        var user = new User
        {
            Id = Guid.CreateVersion7(),
            Email = DemoEmail,
            DisplayName = DemoDisplayName,
            CreatedAt = _timeProvider.GetUtcNow(),
        };
        user.PasswordHash = _passwordHasher.HashPassword(user, DemoPassword);

        _db.Users.Add(user);
        await _db.SaveChangesAsync(cancellationToken);
    }

    #endregion
}
