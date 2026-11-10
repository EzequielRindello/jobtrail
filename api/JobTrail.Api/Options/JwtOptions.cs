namespace JobTrail.Api.Options;

public class JwtOptions
{
    public const string SectionName = "Jwt";
    public string Issuer { get; set; } = string.Empty;
    public string Audience { get; set; } = string.Empty;
    // Secret: user-secrets locally, Jwt__Key env var when deployed.
    public string Key { get; set; } = string.Empty;
    public int ExpiryMinutes { get; set; }
}
