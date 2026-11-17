namespace JobTrail.Api.Exceptions;

// Thrown by services for expected errors; ApiExceptionHandler turns it into a ProblemDetails response.
public class ApiException(int statusCode, string title, IDictionary<string, string[]>? errors = null) : Exception(title)
{
    public int StatusCode { get; } = statusCode;

    public IDictionary<string, string[]>? Errors { get; } = errors;
}
