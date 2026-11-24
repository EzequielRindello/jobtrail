using JobTrail.Api.Models;

namespace JobTrail.Api.Contracts.Applications;

// An application already on the board that looks like the job being saved.
// SameLink: it has the same link (saving it again is rejected). Otherwise the title and the company match.
public record DuplicateApplicationResponse(
    Guid Id,
    string Title,
    string Company,
    ApplicationStage Stage,
    bool SameLink);
