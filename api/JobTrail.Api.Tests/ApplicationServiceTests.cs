using JobTrail.Api.Contracts.Applications;
using JobTrail.Api.Data;
using JobTrail.Api.Exceptions;
using JobTrail.Api.Models;
using JobTrail.Api.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Time.Testing;

namespace JobTrail.Api.Tests;

public class ApplicationServiceTests : IDisposable
{
    private static readonly Guid Me = Guid.NewGuid();
    private static readonly Guid SomeoneElse = Guid.NewGuid();
    private static readonly DateOnly Today = DateOnly.FromDateTime(TestHelpers.Now.UtcDateTime);

    private readonly AppDbContext db = TestHelpers.CreateDbContext();
    private readonly FakeTimeProvider clock = TestHelpers.CreateClock();
    private readonly ApplicationService applicationService;

    public ApplicationServiceTests()
    {
        applicationService = new ApplicationService(db, clock);
    }

    public void Dispose()
    {
        db.Dispose();
    }

    [Fact]
    public async Task Create_TrimsFieldsAndRecordsTheFirstStage()
    {
        var rq = new CreateApplicationRequest
        {
            Title = "  Backend Developer ",
            Company = " Fictional Labs ",
            Location = "   ",
            Url = " https://jobs.example.com/123 ",
        };

        var response = await applicationService.CreateAsync(Me, rq, CancellationToken.None);

        Assert.Equal("Backend Developer", response.Title);
        Assert.Equal("Fictional Labs", response.Company);
        Assert.Null(response.Location);
        Assert.Equal("https://jobs.example.com/123", response.Url);
        Assert.Equal(ApplicationStage.Saved, response.Stage);
        Assert.Null(response.AppliedOn);
        var change = Assert.Single(response.History);
        Assert.Null(change.FromStage);
        Assert.Equal(ApplicationStage.Saved, change.ToStage);
        Assert.Equal(TestHelpers.Now, change.ChangedAt);
        Assert.Equal(1, await db.ApplicationStageChanges.CountAsync());
    }

    [Fact]
    public async Task Create_InApplied_SetsAppliedOnToToday()
    {
        var rq = new CreateApplicationRequest { Title = "QA Engineer", Company = "Example Co", Stage = ApplicationStage.Applied };

        var response = await applicationService.CreateAsync(Me, rq, CancellationToken.None);

        Assert.Equal(Today, response.AppliedOn);
    }

    [Fact]
    public async Task Create_InvalidFields_Throws400WithEveryFieldError()
    {
        var rq = new CreateApplicationRequest
        {
            Title = " ",
            Company = "",
            Url = "jobs.example.com",
            ContactEmail = "not-an-email",
            Notes = new string('a', ApplicationLimits.Notes + 1),
        };

        var ex = await Assert.ThrowsAsync<ApiException>(() => applicationService.CreateAsync(Me, rq, CancellationToken.None));

        Assert.Equal(StatusCodes.Status400BadRequest, ex.StatusCode);
        Assert.Equal(["company", "contactEmail", "notes", "title", "url"], ex.Errors!.Keys.Order());
        Assert.Empty(db.Applications);
    }

    [Fact]
    public async Task Search_ReturnsOnlyMyApplicationsNewestFirst()
    {
        await CreateAsync(Me, "First", "Alpha Fictional");
        clock.Advance(TimeSpan.FromMinutes(1));
        await CreateAsync(Me, "Second", "Beta Fictional");
        await CreateAsync(SomeoneElse, "Not mine", "Gamma Fictional");

        var results = await applicationService.SearchAsync(Me, new SearchApplicationsRequest(), CancellationToken.None);

        Assert.Equal(["Second", "First"], results.Select(r => r.Title));
    }

    [Fact]
    public async Task Search_ByText_MatchesTitleOrCompanyInAnyCase()
    {
        await CreateAsync(Me, "Frontend Developer", "Acme Fictional");
        await CreateAsync(Me, "Data Analyst", "Northwind Example");
        await CreateAsync(Me, "Support Agent", "Contoso");

        var byTitle = await applicationService.SearchAsync(Me, new SearchApplicationsRequest { Search = " DEVELOPER " }, CancellationToken.None);
        var byCompany = await applicationService.SearchAsync(Me, new SearchApplicationsRequest { Search = "northwind" }, CancellationToken.None);

        Assert.Equal("Frontend Developer", Assert.Single(byTitle).Title);
        Assert.Equal("Data Analyst", Assert.Single(byCompany).Title);
    }

    [Fact]
    public async Task Search_ByStage_ReturnsOnlyThatStage()
    {
        await CreateAsync(Me, "Saved one", "Example Co");
        await CreateAsync(Me, "Applied one", "Example Co", ApplicationStage.Applied);

        var results = await applicationService.SearchAsync(Me, new SearchApplicationsRequest { Stage = ApplicationStage.Applied }, CancellationToken.None);

        Assert.Equal("Applied one", Assert.Single(results).Title);
    }

    [Fact]
    public async Task Search_BySavedDate_IncludesBothEndDays()
    {
        await CreateAsync(Me, "Day 1", "Example Co");
        clock.Advance(TimeSpan.FromDays(1));
        await CreateAsync(Me, "Day 2", "Example Co");
        clock.Advance(TimeSpan.FromDays(1));
        await CreateAsync(Me, "Day 3", "Example Co");

        var rq = new SearchApplicationsRequest { From = Today.AddDays(1), To = Today.AddDays(2) };
        var results = await applicationService.SearchAsync(Me, rq, CancellationToken.None);

        Assert.Equal(["Day 3", "Day 2"], results.Select(r => r.Title));
    }

    [Fact]
    public async Task Search_ByAppliedDate_SkipsApplicationsNotApplied()
    {
        await CreateAsync(Me, "Applied long ago", "Example Co", appliedOn: Today.AddDays(-30));
        await CreateAsync(Me, "Applied this week", "Example Co", appliedOn: Today.AddDays(-2));
        await CreateAsync(Me, "Never applied", "Example Co");

        var rq = new SearchApplicationsRequest
        {
            DateField = SearchApplicationsRequest.DateFieldType.Applied,
            From = Today.AddDays(-7),
            To = Today,
        };
        var results = await applicationService.SearchAsync(Me, rq, CancellationToken.None);

        Assert.Equal("Applied this week", Assert.Single(results).Title);
    }

    [Fact]
    public async Task Get_ReturnsDetailsAndHistory()
    {
        var created = await CreateAsync(Me, "Backend Developer", "Fictional Labs");

        var response = await applicationService.GetAsync(Me, created.Id, CancellationToken.None);

        Assert.Equal("Backend Developer", response.Title);
        Assert.Single(response.History);
    }

    [Fact]
    public async Task GetSaveChangeStageDelete_SomeoneElsesApplication_Throws404()
    {
        var theirs = await CreateAsync(SomeoneElse, "Not mine", "Example Co");
        var save = new SaveApplicationRequest { Title = "Changed", Company = "Changed" };
        var stage = new ChangeStageRequest { Stage = ApplicationStage.Offer };

        var errors = new[]
        {
            await Assert.ThrowsAsync<ApiException>(() => applicationService.GetAsync(Me, theirs.Id, CancellationToken.None)),
            await Assert.ThrowsAsync<ApiException>(() => applicationService.SaveAsync(Me, theirs.Id, save, CancellationToken.None)),
            await Assert.ThrowsAsync<ApiException>(() => applicationService.ChangeStageAsync(Me, theirs.Id, stage, CancellationToken.None)),
            await Assert.ThrowsAsync<ApiException>(() => applicationService.DeleteAsync(Me, theirs.Id, CancellationToken.None)),
        };

        Assert.All(errors, ex => Assert.Equal(StatusCodes.Status404NotFound, ex.StatusCode));
        var stored = await db.Applications.SingleAsync();
        Assert.Equal("Not mine", stored.Title);
        Assert.Equal(ApplicationStage.Saved, stored.Stage);
    }

    [Fact]
    public async Task Save_UpdatesDetailsAndKeepsTheStage()
    {
        var created = await CreateAsync(Me, "Backend Developer", "Fictional Labs", ApplicationStage.Interview);
        clock.Advance(TimeSpan.FromHours(1));
        var rq = new SaveApplicationRequest { Title = "Senior Backend Developer", Company = "Fictional Labs", Notes = "Second interview on Friday" };

        var response = await applicationService.SaveAsync(Me, created.Id, rq, CancellationToken.None);

        Assert.Equal("Senior Backend Developer", response.Title);
        Assert.Equal("Second interview on Friday", response.Notes);
        Assert.Equal(ApplicationStage.Interview, response.Stage);
        Assert.Equal(TestHelpers.Now.AddHours(1), response.UpdatedAt);
        Assert.Single(response.History);
    }

    [Fact]
    public async Task ChangeStage_RecordsEveryChangeInOrder()
    {
        var created = await CreateAsync(Me, "Backend Developer", "Fictional Labs");
        clock.Advance(TimeSpan.FromDays(1));
        await applicationService.ChangeStageAsync(Me, created.Id, new ChangeStageRequest { Stage = ApplicationStage.Applied }, CancellationToken.None);
        clock.Advance(TimeSpan.FromDays(1));

        var response = await applicationService.ChangeStageAsync(Me, created.Id, new ChangeStageRequest { Stage = ApplicationStage.Interview }, CancellationToken.None);

        Assert.Equal(ApplicationStage.Interview, response.Stage);
        Assert.Equal(Today.AddDays(1), response.AppliedOn);
        Assert.Equal(
            [(null, ApplicationStage.Saved), (ApplicationStage.Saved, ApplicationStage.Applied), (ApplicationStage.Applied, ApplicationStage.Interview)],
            response.History.Select(c => (c.FromStage, c.ToStage)));
        Assert.Equal(3, await db.ApplicationStageChanges.CountAsync());
    }

    [Fact]
    public async Task ChangeStage_ToTheSameStage_AddsNoHistory()
    {
        var created = await CreateAsync(Me, "Backend Developer", "Fictional Labs");

        var response = await applicationService.ChangeStageAsync(Me, created.Id, new ChangeStageRequest { Stage = ApplicationStage.Saved }, CancellationToken.None);

        Assert.Single(response.History);
        Assert.Equal(1, await db.ApplicationStageChanges.CountAsync());
    }

    [Fact]
    public async Task Delete_RemovesTheApplication()
    {
        var created = await CreateAsync(Me, "Backend Developer", "Fictional Labs");

        await applicationService.DeleteAsync(Me, created.Id, CancellationToken.None);

        Assert.Empty(db.Applications);
    }

    private async Task<ApplicationResponse> CreateAsync(Guid userId, string title, string company, ApplicationStage stage = ApplicationStage.Saved, DateOnly? appliedOn = null)
    {
        var rq = new CreateApplicationRequest { Title = title, Company = company, Stage = stage, AppliedOn = appliedOn };
        return await applicationService.CreateAsync(userId, rq, CancellationToken.None);
    }
}
