namespace JobTrail.Api.Contracts.Auth;

public record AuthResponse(string Token, DateTimeOffset ExpiresAt, UserResponse User);
