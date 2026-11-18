namespace JobTrail.Api.Models;

// One skill of the user, compared with the words of job descriptions for Skills Matching.
public class UserSkill
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public string Name { get; set; } = string.Empty;
}
