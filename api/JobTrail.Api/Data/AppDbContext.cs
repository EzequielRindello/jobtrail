using JobTrail.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace JobTrail.Api.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<User> Users => Set<User>();

    public DbSet<RevokedToken> RevokedTokens => Set<RevokedToken>();

    public DbSet<Application> Applications => Set<Application>();

    public DbSet<ApplicationStageChange> ApplicationStageChanges => Set<ApplicationStageChange>();

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

        modelBuilder.Entity<Application>(application =>
        {
            application.Property(a => a.Title).HasMaxLength(ApplicationLimits.Title);
            application.Property(a => a.Company).HasMaxLength(ApplicationLimits.Company);
            application.Property(a => a.Location).HasMaxLength(ApplicationLimits.Location);
            application.Property(a => a.Url).HasMaxLength(ApplicationLimits.Url);
            application.Property(a => a.Description).HasMaxLength(ApplicationLimits.Description);
            application.Property(a => a.SalaryRange).HasMaxLength(ApplicationLimits.SalaryRange);
            application.Property(a => a.ContactName).HasMaxLength(ApplicationLimits.ContactName);
            application.Property(a => a.ContactEmail).HasMaxLength(ApplicationLimits.ContactEmail);
            application.Property(a => a.ResumeVersion).HasMaxLength(ApplicationLimits.ResumeVersion);
            application.Property(a => a.Notes).HasMaxLength(ApplicationLimits.Notes);
            // Stored as text ("Saved", "Applied"...) so the table is readable without the code.
            application.Property(a => a.Stage).HasConversion<string>().HasMaxLength(ApplicationLimits.Stage);
            application.HasOne<User>().WithMany().HasForeignKey(a => a.UserId).OnDelete(DeleteBehavior.Cascade);
            // The board lists one user's applications, newest first.
            application.HasIndex(a => new { a.UserId, a.CreatedAt });
            application.HasMany(a => a.StageChanges).WithOne().HasForeignKey(c => c.ApplicationId).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<ApplicationStageChange>(change =>
        {
            change.Property(c => c.FromStage).HasConversion<string>().HasMaxLength(ApplicationLimits.Stage);
            change.Property(c => c.ToStage).HasConversion<string>().HasMaxLength(ApplicationLimits.Stage);
        });
    }
}
