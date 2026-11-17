using JobTrail.Api.Contracts.Applications;
using JobTrail.Api.Extensions;
using JobTrail.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace JobTrail.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/applications")]
[Produces("application/json")]
public class ApplicationsController(ApplicationService applicationService) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<List<ApplicationSummaryResponse>>> Search([FromQuery] SearchApplicationsRequest rq, CancellationToken cancellationToken)
    {
        return Ok(await applicationService.SearchAsync(User.GetUserId(), rq, cancellationToken));
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<ApplicationResponse>> Get(Guid id, CancellationToken cancellationToken)
    {
        return Ok(await applicationService.GetAsync(User.GetUserId(), id, cancellationToken));
    }

    [HttpPost]
    public async Task<ActionResult<ApplicationResponse>> Create(CreateApplicationRequest rq, CancellationToken cancellationToken)
    {
        return Ok(await applicationService.CreateAsync(User.GetUserId(), rq, cancellationToken));
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<ApplicationResponse>> Save(Guid id, SaveApplicationRequest rq, CancellationToken cancellationToken)
    {
        return Ok(await applicationService.SaveAsync(User.GetUserId(), id, rq, cancellationToken));
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken cancellationToken)
    {
        await applicationService.DeleteAsync(User.GetUserId(), id, cancellationToken);
        return NoContent();
    }

    [HttpPut("{id:guid}/stage")]
    public async Task<ActionResult<ApplicationResponse>> ChangeStage(Guid id, ChangeStageRequest rq, CancellationToken cancellationToken)
    {
        return Ok(await applicationService.ChangeStageAsync(User.GetUserId(), id, rq, cancellationToken));
    }
}
