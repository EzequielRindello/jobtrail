using JobTrail.Api.Models;

namespace JobTrail.Api.Contracts.Applications;

public record ApplicationResponse(
    Guid Id,
    string Title,
    string Company,
    string? Location,
    string? Url,
    string? Description,
    string? SalaryRange,
    string? ContactName,
    string? ContactEmail,
    string? ResumeVersion,
    string? Notes,
    ApplicationStage Stage,
    DateOnly? AppliedOn,
    DateTimeOffset CreatedAt,
    DateTimeOffset UpdatedAt,
    IReadOnlyList<ApplicationResponse.StageChange> History)
{
    public record StageChange(ApplicationStage? FromStage, ApplicationStage ToStage, DateTimeOffset ChangedAt);
}
