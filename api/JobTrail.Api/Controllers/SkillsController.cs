using JobTrail.Api.Contracts.Skills;
using JobTrail.Api.Extensions;
using JobTrail.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace JobTrail.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/skills")]
[Produces("application/json")]
public class SkillsController(SkillService skillService) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<List<SkillResponse>>> Search(CancellationToken cancellationToken)
    {
        return Ok(await skillService.SearchAsync(User.GetUserId(), cancellationToken));
    }

    [HttpPost]
    public async Task<ActionResult<SkillResponse>> Create(CreateSkillRequest rq, CancellationToken cancellationToken)
    {
        return Ok(await skillService.CreateAsync(User.GetUserId(), rq, cancellationToken));
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken cancellationToken)
    {
        await skillService.DeleteAsync(User.GetUserId(), id, cancellationToken);
        return NoContent();
    }
}
