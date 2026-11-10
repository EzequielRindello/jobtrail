namespace JobTrail.Api.Models;

// Max lengths of the application fields, shared by the database columns and the validations.
public static class ApplicationLimits
{
    public const int Title = 200;
    public const int Company = 200;
    public const int Location = 200;
    public const int Url = 2048;
    public const int Description = 100_000;
    public const int SalaryRange = 100;
    public const int ContactName = 100;
    public const int ContactEmail = 256;
    public const int ResumeVersion = 100;
    public const int Notes = 10_000;
    public const int Stage = 20;
}
