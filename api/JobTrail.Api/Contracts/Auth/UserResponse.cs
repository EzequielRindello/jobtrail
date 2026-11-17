namespace JobTrail.Api.Contracts.Auth;

public record UserResponse(Guid Id, string Email, string DisplayName);
