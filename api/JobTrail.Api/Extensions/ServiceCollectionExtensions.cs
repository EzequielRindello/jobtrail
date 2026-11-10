using System.Security.Claims;
using System.Text;
using JobTrail.Api.Options;
using JobTrail.Api.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.JsonWebTokens;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi;

namespace JobTrail.Api.Extensions;

public static class ServiceCollectionExtensions
{
    private const int MinJwtKeyLength = 32;

    public static IServiceCollection AddJwtAuthentication(this IServiceCollection services, IConfiguration configuration)
    {
        // Fails at startup instead of on the first login when the secret is missing.
        services.AddOptions<JwtOptions>()
            .Bind(configuration.GetSection(JwtOptions.SectionName))
            .Validate(jwt => jwt.Key.Length >= MinJwtKeyLength, $"Jwt:Key must have at least {MinJwtKeyLength} characters. Set it with dotnet user-secrets (see README).")
            .Validate(jwt => jwt.Issuer.Length > 0 && jwt.Audience.Length > 0 && jwt.ExpiryMinutes > 0, "Jwt:Issuer, Jwt:Audience and Jwt:ExpiryMinutes are required.")
            .ValidateOnStart();

        services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme).AddJwtBearer();

        services.AddOptions<JwtBearerOptions>(JwtBearerDefaults.AuthenticationScheme)
            .Configure<IOptions<JwtOptions>>((bearer, jwtOptions) =>
            {
                var jwt = jwtOptions.Value;

                // Keep the token's claim names ("sub", "jti") instead of the long .NET ones.
                bearer.MapInboundClaims = false;
                bearer.TokenValidationParameters = new TokenValidationParameters
                {
                    ValidIssuer = jwt.Issuer,
                    ValidAudience = jwt.Audience,
                    IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwt.Key)),
                    NameClaimType = JwtRegisteredClaimNames.Name,
                    ClockSkew = TimeSpan.FromSeconds(30),
                };

                // A valid signature is not enough: the token may have been logged out.
                bearer.Events = new JwtBearerEvents
                {
                    OnTokenValidated = async context =>
                    {
                        var jti = context.Principal?.FindFirstValue(JwtRegisteredClaimNames.Jti);
                        var authService = context.HttpContext.RequestServices.GetRequiredService<AuthService>();

                        if (!Guid.TryParse(jti, out var tokenId)
                            || await authService.IsTokenRevokedAsync(tokenId, context.HttpContext.RequestAborted))
                        {
                            context.Fail("This token was logged out.");
                        }
                    },
                };
            });

        services.AddAuthorization();
        return services;
    }

    public static IServiceCollection AddSwaggerDocs(this IServiceCollection services)
    {
        services.AddEndpointsApiExplorer();
        services.AddSwaggerGen(options =>
        {
            options.SwaggerDoc("v1", new OpenApiInfo { Title = "JobTrail API", Version = "v1" });

            options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
            {
                Type = SecuritySchemeType.Http,
                Scheme = "bearer",
                BearerFormat = "JWT",
                Description = "Paste the token returned by /api/auth/login.",
            });
            options.OperationFilter<AuthorizeOperationFilter>();
        });

        return services;
    }
}
