using JobTrail.Api.Models;

namespace JobTrail.Api.Contracts.Applications;

public class ChangeStageRequest
{
    public ApplicationStage Stage { get; init; }
}
