using System.Net.Mail;
using JobTrail.Api.Contracts.Applications;
using JobTrail.Api.Data;
using JobTrail.Api.Exceptions;
using JobTrail.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace JobTrail.Api.Services;

public class ApplicationService
{
    #region Constructor

    private readonly AppDbContext _db;
    private readonly TimeProvider _timeProvider;

    public ApplicationService(AppDbContext db, TimeProvider timeProvider)
    {
        _db = db;
        _timeProvider = timeProvider;
    }

    #endregion

    #region Setup

    public async Task<List<ApplicationSummaryResponse>> SearchAsync(Guid userId, SearchApplicationsRequest rq, CancellationToken cancellationToken)
    {
        var query = _db.Applications.Where(a => a.UserId == userId);

        if (!string.IsNullOrWhiteSpace(rq.Search))
        {
            var term = rq.Search.Trim().ToLowerInvariant();
            query = query.Where(a => a.Title.ToLower().Contains(term) || a.Company.ToLower().Contains(term));
        }

        if (rq.Stage is not null)
        {
            query = query.Where(a => a.Stage == rq.Stage);
        }

        query = rq.DateField == SearchApplicationsRequest.DateFieldType.Applied
            ? FilterByAppliedOn(query, rq.From, rq.To)
            : FilterByCreatedAt(query, rq.From, rq.To);

        return await query
            .OrderByDescending(a => a.CreatedAt)
            .Select(a => new ApplicationSummaryResponse(a.Id, a.Title, a.Company, a.Location, a.Stage, a.AppliedOn, a.CreatedAt, a.UpdatedAt))
            .ToListAsync(cancellationToken);
    }

    public async Task<ApplicationResponse> GetAsync(Guid userId, Guid applicationId, CancellationToken cancellationToken)
    {
        var application = await _db.Applications
            .AsNoTracking()
            .Include(a => a.StageChanges)
            .FirstOrDefaultAsync(a => a.Id == applicationId && a.UserId == userId, cancellationToken);

        return CreateResponse(application ?? throw NotFoundException());
    }

    public async Task<ApplicationResponse> CreateAsync(Guid userId, CreateApplicationRequest rq, CancellationToken cancellationToken)
    {
        ValidateSave(rq);

        var now = _timeProvider.GetUtcNow();
        var application = new Application
        {
            Id = Guid.CreateVersion7(),
            UserId = userId,
            Stage = rq.Stage,
            CreatedAt = now,
            UpdatedAt = now,
        };
        CopyDetails(rq, application);
        SetAppliedOnIfApplied(application, now);
        application.StageChanges.Add(CreateStageChange(application, null, rq.Stage, now));

        _db.Applications.Add(application);
        await _db.SaveChangesAsync(cancellationToken);

        return CreateResponse(application);
    }

    public async Task<ApplicationResponse> SaveAsync(Guid userId, Guid applicationId, SaveApplicationRequest rq, CancellationToken cancellationToken)
    {
        ValidateSave(rq);

        var application = await FindAsync(userId, applicationId, cancellationToken);
        CopyDetails(rq, application);
        application.UpdatedAt = _timeProvider.GetUtcNow();

        await _db.SaveChangesAsync(cancellationToken);

        return CreateResponse(application);
    }

    public async Task DeleteAsync(Guid userId, Guid applicationId, CancellationToken cancellationToken)
    {
        var application = await _db.Applications
            .FirstOrDefaultAsync(a => a.Id == applicationId && a.UserId == userId, cancellationToken)
            ?? throw NotFoundException();

        // The database deletes its stage changes too (cascade).
        _db.Applications.Remove(application);
        await _db.SaveChangesAsync(cancellationToken);
    }

    public async Task<ApplicationResponse> ChangeStageAsync(Guid userId, Guid applicationId, ChangeStageRequest rq, CancellationToken cancellationToken)
    {
        var application = await FindAsync(userId, applicationId, cancellationToken);

        // Dropping a card on its own column is not a change, so it adds no history row.
        if (application.Stage == rq.Stage)
        {
            return CreateResponse(application);
        }

        var now = _timeProvider.GetUtcNow();
        // Added through the DbSet: a new row with its id already set, found only through the
        // navigation, would be taken for an existing one and updated instead of inserted.
        _db.ApplicationStageChanges.Add(CreateStageChange(application, application.Stage, rq.Stage, now));
        application.Stage = rq.Stage;
        application.UpdatedAt = now;
        SetAppliedOnIfApplied(application, now);

        await _db.SaveChangesAsync(cancellationToken);

        return CreateResponse(application);
    }

    #endregion

    #region Validations

    private static void ValidateSave(SaveApplicationRequest rq)
    {
        var errors = new Dictionary<string, string[]>();

        if (string.IsNullOrWhiteSpace(rq.Title))
        {
            errors["title"] = ["Enter the job title."];
        }
        else if (rq.Title.Trim().Length > ApplicationLimits.Title)
        {
            errors["title"] = [TooLongMessage(ApplicationLimits.Title)];
        }

        if (string.IsNullOrWhiteSpace(rq.Company))
        {
            errors["company"] = ["Enter the company."];
        }
        else if (rq.Company.Trim().Length > ApplicationLimits.Company)
        {
            errors["company"] = [TooLongMessage(ApplicationLimits.Company)];
        }

        var url = Clean(rq.Url);
        if (url is not null && !IsValidUrl(url))
        {
            errors["url"] = ["Enter a full link that starts with http:// or https://."];
        }

        var contactEmail = Clean(rq.ContactEmail);
        if (contactEmail is not null && !IsValidEmail(contactEmail))
        {
            errors["contactEmail"] = ["Enter a valid email."];
        }

        AddLengthError(errors, "location", rq.Location, ApplicationLimits.Location);
        AddLengthError(errors, "description", rq.Description, ApplicationLimits.Description);
        AddLengthError(errors, "salaryRange", rq.SalaryRange, ApplicationLimits.SalaryRange);
        AddLengthError(errors, "contactName", rq.ContactName, ApplicationLimits.ContactName);
        AddLengthError(errors, "resumeVersion", rq.ResumeVersion, ApplicationLimits.ResumeVersion);
        AddLengthError(errors, "notes", rq.Notes, ApplicationLimits.Notes);

        if (errors.Count > 0)
        {
            throw new ApiException(StatusCodes.Status400BadRequest, "Some fields are not valid.", errors);
        }
    }

    #endregion

    #region Private Helpers

    private async Task<Application> FindAsync(Guid userId, Guid applicationId, CancellationToken cancellationToken)
    {
        return await _db.Applications
            .Include(a => a.StageChanges)
            .FirstOrDefaultAsync(a => a.Id == applicationId && a.UserId == userId, cancellationToken)
            ?? throw NotFoundException();
    }

    private static IQueryable<Application> FilterByCreatedAt(IQueryable<Application> query, DateOnly? from, DateOnly? to)
    {
        // Days are UTC days: "to" includes the whole day, up to the start of the next one.
        if (from is not null)
        {
            var start = ToUtcStartOfDay(from.Value);
            query = query.Where(a => a.CreatedAt >= start);
        }

        if (to is not null)
        {
            var end = ToUtcStartOfDay(to.Value.AddDays(1));
            query = query.Where(a => a.CreatedAt < end);
        }

        return query;
    }

    private static IQueryable<Application> FilterByAppliedOn(IQueryable<Application> query, DateOnly? from, DateOnly? to)
    {
        if (from is not null)
        {
            query = query.Where(a => a.AppliedOn >= from);
        }

        if (to is not null)
        {
            query = query.Where(a => a.AppliedOn <= to);
        }

        return query;
    }

    private static void CopyDetails(SaveApplicationRequest rq, Application application)
    {
        application.Title = rq.Title.Trim();
        application.Company = rq.Company.Trim();
        application.Location = Clean(rq.Location);
        application.Url = Clean(rq.Url);
        application.Description = Clean(rq.Description);
        application.SalaryRange = Clean(rq.SalaryRange);
        application.ContactName = Clean(rq.ContactName);
        application.ContactEmail = Clean(rq.ContactEmail);
        application.ResumeVersion = Clean(rq.ResumeVersion);
        application.Notes = Clean(rq.Notes);
        application.AppliedOn = rq.AppliedOn;
    }

    // Creating it in Applied, or moving it there, dates the application if the user did not.
    private static void SetAppliedOnIfApplied(Application application, DateTimeOffset now)
    {
        if (application.Stage == ApplicationStage.Applied && application.AppliedOn is null)
        {
            application.AppliedOn = DateOnly.FromDateTime(now.UtcDateTime);
        }
    }

    private static ApplicationStageChange CreateStageChange(Application application, ApplicationStage? from, ApplicationStage to, DateTimeOffset changedAt)
    {
        return new ApplicationStageChange
        {
            Id = Guid.CreateVersion7(),
            ApplicationId = application.Id,
            FromStage = from,
            ToStage = to,
            ChangedAt = changedAt,
        };
    }

    private static ApplicationResponse CreateResponse(Application application)
    {
        var history = application.StageChanges
            .OrderBy(c => c.ChangedAt)
            .Select(c => new ApplicationResponse.StageChange(c.FromStage, c.ToStage, c.ChangedAt))
            .ToList();

        return new ApplicationResponse(
            application.Id,
            application.Title,
            application.Company,
            application.Location,
            application.Url,
            application.Description,
            application.SalaryRange,
            application.ContactName,
            application.ContactEmail,
            application.ResumeVersion,
            application.Notes,
            application.Stage,
            application.AppliedOn,
            application.CreatedAt,
            application.UpdatedAt,
            history);
    }

    // Trims the text and turns an empty field into null, so the database never stores "".
    private static string? Clean(string? value)
    {
        return string.IsNullOrWhiteSpace(value) ? null : value.Trim();
    }

    private static void AddLengthError(Dictionary<string, string[]> errors, string field, string? value, int maxLength)
    {
        if (Clean(value)?.Length > maxLength)
        {
            errors[field] = [TooLongMessage(maxLength)];
        }
    }

    private static string TooLongMessage(int maxLength)
    {
        return $"Use up to {maxLength} characters.";
    }

    private static bool IsValidUrl(string url)
    {
        return url.Length <= ApplicationLimits.Url
            && Uri.TryCreate(url, UriKind.Absolute, out var uri)
            && (uri.Scheme == Uri.UriSchemeHttp || uri.Scheme == Uri.UriSchemeHttps);
    }

    private static bool IsValidEmail(string email)
    {
        return email.Length <= ApplicationLimits.ContactEmail
            && MailAddress.TryCreate(email, out var address)
            && address.Address == email;
    }

    private static DateTimeOffset ToUtcStartOfDay(DateOnly day)
    {
        return new DateTimeOffset(day.ToDateTime(TimeOnly.MinValue), TimeSpan.Zero);
    }

    private static ApiException NotFoundException()
    {
        return new ApiException(StatusCodes.Status404NotFound, "Application not found.");
    }

    #endregion
}
