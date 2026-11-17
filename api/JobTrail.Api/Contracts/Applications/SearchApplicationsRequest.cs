using JobTrail.Api.Models;

namespace JobTrail.Api.Contracts.Applications;

// Every filter is optional; the ones left empty are not applied.
public class SearchApplicationsRequest
{
    public string? Search { get; init; }
    public ApplicationStage? Stage { get; init; }
    public DateOnly? From { get; init; }
    public DateOnly? To { get; init; }
    public DateFieldType DateField { get; init; } = DateFieldType.Saved;

    // Which date From and To filter by.
    public enum DateFieldType
    {
        Saved,
        Applied,
    }
}
