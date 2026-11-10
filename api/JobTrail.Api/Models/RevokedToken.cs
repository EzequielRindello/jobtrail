namespace JobTrail.Api.Models;

// A logged-out JWT. JWTs can't be deleted, so each request checks this table until the token expires.
public class RevokedToken
{
    public Guid Jti { get; set; }
    public Guid UserId { get; set; }
    public DateTimeOffset ExpiresAt { get; set; }
}
