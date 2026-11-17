namespace JobTrail.Api.Models;

public class ApplicationStageChange
{
    public Guid Id { get; set; }
    public Guid ApplicationId { get; set; }
    // Null for the first stage, when the application is created.
    public ApplicationStage? FromStage { get; set; }
    public ApplicationStage ToStage { get; set; }
    public DateTimeOffset ChangedAt { get; set; }
}
