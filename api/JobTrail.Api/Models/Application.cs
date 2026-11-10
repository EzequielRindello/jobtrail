namespace JobTrail.Api.Models;

public class Application
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Company { get; set; } = string.Empty;
    public string? Location { get; set; }
    public string? Url { get; set; }
    // Copy of the job post, kept even if the original is taken down.
    public string? Description { get; set; }
    public string? SalaryRange { get; set; }
    public string? ContactName { get; set; }
    public string? ContactEmail { get; set; }
    public string? ResumeVersion { get; set; }
    public string? Notes { get; set; }
    public ApplicationStage Stage { get; set; }
    public DateOnly? AppliedOn { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }
    public List<ApplicationStageChange> StageChanges { get; set; } = [];
}
