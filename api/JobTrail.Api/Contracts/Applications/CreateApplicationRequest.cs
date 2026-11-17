using JobTrail.Api.Models;

namespace JobTrail.Api.Contracts.Applications;

public class CreateApplicationRequest : SaveApplicationRequest
{
    public ApplicationStage Stage { get; init; } = ApplicationStage.Saved;
}
