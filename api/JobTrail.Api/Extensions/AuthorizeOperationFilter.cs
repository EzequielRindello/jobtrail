using Microsoft.AspNetCore.Authorization;
using Microsoft.OpenApi;
using Swashbuckle.AspNetCore.SwaggerGen;

namespace JobTrail.Api.Extensions;

// Shows the Swagger lock only on [Authorize] endpoints, so register and login don't look protected.
public class AuthorizeOperationFilter : IOperationFilter
{
    public void Apply(OpenApiOperation operation, OperationFilterContext context)
    {
        var metadata = context.ApiDescription.ActionDescriptor.EndpointMetadata;
        if (!metadata.OfType<IAuthorizeData>().Any() || metadata.OfType<IAllowAnonymous>().Any())
        {
            return;
        }

        operation.Security ??= [];
        operation.Security.Add(new OpenApiSecurityRequirement
        {
            [new OpenApiSecuritySchemeReference("Bearer", context.Document)] = [],
        });
    }
}
