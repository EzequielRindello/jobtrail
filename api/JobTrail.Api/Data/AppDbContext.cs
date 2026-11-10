using JobTrail.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace JobTrail.Api.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<User> Users => Set<User>();

    public DbSet<RevokedToken> RevokedTokens => Set<RevokedToken>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<User>(user =>
        {
            user.Property(u => u.Email).HasMaxLength(256);
            user.HasIndex(u => u.Email).IsUnique();
            user.Property(u => u.DisplayName).HasMaxLength(100);
        });

        modelBuilder.Entity<RevokedToken>(token =>
        {
            token.HasKey(t => t.Jti);
            // The id comes from the JWT, not from the database.
            token.Property(t => t.Jti).ValueGeneratedNever();
            token.HasOne<User>().WithMany().HasForeignKey(t => t.UserId).OnDelete(DeleteBehavior.Cascade);
            token.HasIndex(t => t.ExpiresAt);
        });
    }
}
