using JobTrail.Api.Contracts.Auth;
using JobTrail.Api.Extensions;
using JobTrail.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace JobTrail.Api.Controllers;

[ApiController]
[Route("api/auth")]
[Produces("application/json")]
public class AuthController(AuthService authService) : ControllerBase
{
    [Authorize]
    [HttpGet("me")]
    public async Task<ActionResult<UserResponse>> Me(CancellationToken cancellationToken)
    {
        return Ok(await authService.GetUserAsync(User.GetUserId(), cancellationToken));
    }

    [HttpPost("register")]
    public async Task<ActionResult<AuthResponse>> Register(RegisterRequest rq, CancellationToken cancellationToken)
    {
        return Ok(await authService.RegisterAsync(rq, cancellationToken));
    }

    [HttpPost("login")]
    public async Task<ActionResult<AuthResponse>> Login(LoginRequest rq, CancellationToken cancellationToken)
    {
        return Ok(await authService.LoginAsync(rq, cancellationToken));
    }

    [Authorize]
    [HttpPost("logout")]
    public async Task<IActionResult> Logout(CancellationToken cancellationToken)
    {
        await authService.LogoutAsync(User.GetUserId(), User.GetTokenId(), User.GetTokenExpiry(), cancellationToken);
        return NoContent();
    }
}
