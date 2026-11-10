namespace JobTrail.Api.Contracts.Applications;

public class SaveApplicationRequest
{
    public string Title { get; init; } = string.Empty;
    public string Company { get; init; } = string.Empty;
    public string? Location { get; init; }
    public string? Url { get; init; }
    public string? Description { get; init; }
    public string? SalaryRange { get; init; }
    public string? ContactName { get; init; }
    public string? ContactEmail { get; init; }
    public string? ResumeVersion { get; init; }
    public string? Notes { get; init; }
    public DateOnly? AppliedOn { get; init; }
}
