using System.Security.Claims;
using Microsoft.IdentityModel.JsonWebTokens;

namespace JobTrail.Api.Extensions;

// Only for [Authorize] endpoints: the JWT middleware has already validated these claims.
public static class ClaimsPrincipalExtensions
{
    public static Guid GetUserId(this ClaimsPrincipal principal)
    {
        return Guid.Parse(principal.FindFirstValue(JwtRegisteredClaimNames.Sub)!);
    }

    public static Guid GetTokenId(this ClaimsPrincipal principal)
    {
        return Guid.Parse(principal.FindFirstValue(JwtRegisteredClaimNames.Jti)!);
    }

    public static DateTimeOffset GetTokenExpiry(this ClaimsPrincipal principal)
    {
        return DateTimeOffset.FromUnixTimeSeconds(long.Parse(principal.FindFirstValue(JwtRegisteredClaimNames.Exp)!));
    }
}
