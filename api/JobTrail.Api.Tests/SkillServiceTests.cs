using JobTrail.Api.Contracts.Skills;
using JobTrail.Api.Data;
using JobTrail.Api.Exceptions;
using JobTrail.Api.Services;
using Microsoft.AspNetCore.Http;

namespace JobTrail.Api.Tests;

public class SkillServiceTests : IDisposable
{
    private static readonly Guid Me = Guid.NewGuid();
    private static readonly Guid SomeoneElse = Guid.NewGuid();

    private readonly AppDbContext db = TestHelpers.CreateDbContext();
    private readonly SkillService skillService;

    public SkillServiceTests()
    {
        skillService = new SkillService(db);
    }

    public void Dispose()
    {
        db.Dispose();
    }

    [Fact]
    public async Task Create_TrimsTheNameAndReturnsIt()
    {
        var response = await skillService.CreateAsync(Me, new CreateSkillRequest { Name = "  C#  " }, CancellationToken.None);

        Assert.Equal("C#", response.Name);
        Assert.Single(db.UserSkills);
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    public async Task Create_EmptyName_Throws400(string name)
    {
        var ex = await Assert.ThrowsAsync<ApiException>(() => skillService.CreateAsync(Me, new CreateSkillRequest { Name = name }, CancellationToken.None));

        Assert.Equal(StatusCodes.Status400BadRequest, ex.StatusCode);
        Assert.Contains("name", ex.Errors!.Keys);
        Assert.Empty(db.UserSkills);
    }

    [Fact]
    public async Task Create_NameTooLong_Throws400()
    {
        var rq = new CreateSkillRequest { Name = new string('a', SkillService.MaxNameLength + 1) };

        var ex = await Assert.ThrowsAsync<ApiException>(() => skillService.CreateAsync(Me, rq, CancellationToken.None));

        Assert.Equal(StatusCodes.Status400BadRequest, ex.StatusCode);
    }

    [Fact]
    public async Task Create_SameSkillInAnyCase_Throws409()
    {
        await skillService.CreateAsync(Me, new CreateSkillRequest { Name = "React" }, CancellationToken.None);

        var ex = await Assert.ThrowsAsync<ApiException>(() => skillService.CreateAsync(Me, new CreateSkillRequest { Name = " react " }, CancellationToken.None));

        Assert.Equal(StatusCodes.Status409Conflict, ex.StatusCode);
        Assert.Single(db.UserSkills);
    }

    [Fact]
    public async Task Create_SameSkillForAnotherUser_IsAllowed()
    {
        await skillService.CreateAsync(Me, new CreateSkillRequest { Name = "SQL" }, CancellationToken.None);

        await skillService.CreateAsync(SomeoneElse, new CreateSkillRequest { Name = "SQL" }, CancellationToken.None);

        Assert.Equal(2, db.UserSkills.Count());
    }

    [Fact]
    public async Task Search_ReturnsOnlyMySkillsSortedIgnoringCase()
    {
        await skillService.CreateAsync(Me, new CreateSkillRequest { Name = "typescript" }, CancellationToken.None);
        await skillService.CreateAsync(Me, new CreateSkillRequest { Name = "Docker" }, CancellationToken.None);
        await skillService.CreateAsync(Me, new CreateSkillRequest { Name = "azure" }, CancellationToken.None);
        await skillService.CreateAsync(SomeoneElse, new CreateSkillRequest { Name = "Not mine" }, CancellationToken.None);

        var results = await skillService.SearchAsync(Me, CancellationToken.None);

        Assert.Equal(["azure", "Docker", "typescript"], results.Select(r => r.Name));
    }

    [Fact]
    public async Task Delete_RemovesMySkill()
    {
        var skill = await skillService.CreateAsync(Me, new CreateSkillRequest { Name = "Go" }, CancellationToken.None);

        await skillService.DeleteAsync(Me, skill.Id, CancellationToken.None);

        Assert.Empty(db.UserSkills);
    }

    [Fact]
    public async Task Delete_SomeoneElsesSkill_Throws404AndKeepsIt()
    {
        var skill = await skillService.CreateAsync(SomeoneElse, new CreateSkillRequest { Name = "Rust" }, CancellationToken.None);

        var ex = await Assert.ThrowsAsync<ApiException>(() => skillService.DeleteAsync(Me, skill.Id, CancellationToken.None));

        Assert.Equal(StatusCodes.Status404NotFound, ex.StatusCode);
        Assert.Single(db.UserSkills);
    }
}
