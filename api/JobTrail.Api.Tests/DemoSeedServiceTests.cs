using JobTrail.Api.Contracts.Auth;
using JobTrail.Api.Data;
using JobTrail.Api.Models;
using JobTrail.Api.Services;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Time.Testing;

namespace JobTrail.Api.Tests;

public class DemoSeedServiceTests : IDisposable
{
    private readonly AppDbContext db = TestHelpers.CreateDbContext();
    private readonly FakeTimeProvider clock = TestHelpers.CreateClock();
    private readonly DemoSeedService seedService;
    private readonly AuthService authService;

    public DemoSeedServiceTests()
    {
        var passwordHasher = new PasswordHasher<User>();
        seedService = new DemoSeedService(db, passwordHasher, clock);
        authService = new AuthService(
            db,
            passwordHasher,
            clock,
            Microsoft.Extensions.Options.Options.Create(TestHelpers.JwtOptions));
    }

    public void Dispose()
    {
        db.Dispose();
    }

    [Fact]
    public async Task Seed_ThenLogin_ReturnsTokenForDemoUser()
    {
        await seedService.SeedAsync(CancellationToken.None);

        var login = new LoginRequest { Email = DemoSeedService.DemoEmail, Password = DemoSeedService.DemoPassword };
        var response = await authService.LoginAsync(login, CancellationToken.None);

        Assert.NotEmpty(response.Token);
        Assert.Equal(DemoSeedService.DemoEmail, response.User.Email);
        Assert.Equal(DemoSeedService.DemoDisplayName, response.User.DisplayName);
    }

    [Fact]
    public async Task Seed_EveryStartup_CreatesTheUserOnlyOnce()
    {
        await seedService.SeedAsync(CancellationToken.None);
        await seedService.SeedAsync(CancellationToken.None);

        Assert.Equal(1, await db.Users.CountAsync());
    }
}
