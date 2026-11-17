using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Mvc;

namespace JobTrail.Api.Exceptions;

public class ApiExceptionHandler(IProblemDetailsService problemDetailsService) : IExceptionHandler
{
    public async ValueTask<bool> TryHandleAsync(HttpContext httpContext, Exception exception, CancellationToken cancellationToken)
    {
        if (exception is not ApiException apiException)
        {
            return false;
        }

        var problem = apiException.Errors is null
            ? new ProblemDetails()
            : new ValidationProblemDetails(apiException.Errors);
        problem.Status = apiException.StatusCode;
        problem.Title = apiException.Message;

        httpContext.Response.StatusCode = apiException.StatusCode;
        return await problemDetailsService.TryWriteAsync(new ProblemDetailsContext
        {
            HttpContext = httpContext,
            ProblemDetails = problem,
            Exception = exception,
        });
    }
}
