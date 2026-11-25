namespace JobTrail.Api.Contracts.Applications;

// The job the user is about to save. Every field is optional; the empty ones are not compared.
public class FindDuplicatesRequest
{
    public string? Url { get; init; }
    public string? Title { get; init; }
    public string? Company { get; init; }
}
