using JobTrail.Api.Contracts.Skills;
using JobTrail.Api.Data;
using JobTrail.Api.Exceptions;
using JobTrail.Api.Models;
using Microsoft.EntityFrameworkCore;
using Npgsql;

namespace JobTrail.Api.Services;

public class SkillService
{
    #region Consts

    public const int MaxNameLength = 50;

    #endregion

    #region Constructor

    private readonly AppDbContext _db;

    public SkillService(AppDbContext db)
    {
        _db = db;
    }

    #endregion

    #region Setup

    public async Task<List<SkillResponse>> SearchAsync(Guid userId, CancellationToken cancellationToken)
    {
        return await _db.UserSkills
            .Where(s => s.UserId == userId)
            .OrderBy(s => s.Name.ToLower())
            .Select(s => new SkillResponse(s.Id, s.Name))
            .ToListAsync(cancellationToken);
    }

    public async Task<SkillResponse> CreateAsync(Guid userId, CreateSkillRequest rq, CancellationToken cancellationToken)
    {
        ValidateCreate(rq);

        var name = rq.Name.Trim();
        var lowerName = name.ToLower();
        var exists = await _db.UserSkills.AnyAsync(s => s.UserId == userId && s.Name.ToLower() == lowerName, cancellationToken);
        if (exists)
        {
            throw DuplicateException();
        }

        var skill = new UserSkill { Id = Guid.CreateVersion7(), UserId = userId, Name = name };
        _db.UserSkills.Add(skill);
        try
        {
            await _db.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateException ex) when (ex.InnerException is PostgresException { SqlState: PostgresErrorCodes.UniqueViolation })
        {
            // Two requests with the same skill at once: the unique index rejects the second one.
            throw DuplicateException();
        }

        return new SkillResponse(skill.Id, skill.Name);
    }

    public async Task DeleteAsync(Guid userId, Guid skillId, CancellationToken cancellationToken)
    {
        var skill = await _db.UserSkills
            .FirstOrDefaultAsync(s => s.Id == skillId && s.UserId == userId, cancellationToken)
            ?? throw new ApiException(StatusCodes.Status404NotFound, "Skill not found.");

        _db.UserSkills.Remove(skill);
        await _db.SaveChangesAsync(cancellationToken);
    }

    #endregion

    #region Validations

    private static void ValidateCreate(CreateSkillRequest rq)
    {
        var errors = new Dictionary<string, string[]>();

        if (string.IsNullOrWhiteSpace(rq.Name))
        {
            errors["name"] = ["Enter the skill."];
        }
        else if (rq.Name.Trim().Length > MaxNameLength)
        {
            errors["name"] = [$"Use up to {MaxNameLength} characters."];
        }

        if (errors.Count > 0)
        {
            throw new ApiException(StatusCodes.Status400BadRequest, "Some fields are not valid.", errors);
        }
    }

    #endregion

    #region Private Helpers

    private static ApiException DuplicateException()
    {
        return new ApiException(StatusCodes.Status409Conflict, "You already have this skill.");
    }

    #endregion
}
