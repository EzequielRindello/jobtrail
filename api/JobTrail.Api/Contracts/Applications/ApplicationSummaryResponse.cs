using JobTrail.Api.Models;

namespace JobTrail.Api.Contracts.Applications;

// One card on the board.
public record ApplicationSummaryResponse(
    Guid Id,
    string Title,
    string Company,
    string? Location,
    ApplicationStage Stage,
    DateOnly? AppliedOn,
    DateTimeOffset CreatedAt,
    DateTimeOffset UpdatedAt);
