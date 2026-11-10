using JobTrail.Api.Data;
using JobTrail.Api.Options;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Time.Testing;

namespace JobTrail.Api.Tests;

internal static class TestHelpers
{
    public static readonly DateTimeOffset Now = new(2026, 11, 10, 12, 0, 0, TimeSpan.Zero);

    public static JwtOptions JwtOptions { get; } = new()
    {
        Issuer = "JobTrail.Tests",
        Audience = "JobTrail.Tests",
        Key = "test-signing-key-that-is-long-enough-for-hs256",
        ExpiryMinutes = 60,
    };

    // A new database per test, so tests never share data.
    public static AppDbContext CreateDbContext()
    {
        return new AppDbContext(new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options);
    }

    public static FakeTimeProvider CreateClock()
    {
        return new FakeTimeProvider(Now);
    }
}
