import { useEffect, useState } from 'react';
import { addSkill, deleteSkill, getSkills, type Skill } from '../api/skillsApi';

import '../styles/Skills.css';

// Same limit as the API (SkillService.MaxNameLength).
const MAX_SKILL_LENGTH = 50;

function sortByName(skills: Skill[]): Skill[] {
  return [...skills].sort((a, b) =>
    a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }),
  );
}

export default function SkillsPage() {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [name, setName] = useState('');
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    let ignore = false;

    getSkills()
      .then((loaded) => {
        if (!ignore) {
          setSkills(loaded);
        }
      })
      .catch((error) => {
        if (!ignore) {
          setError(error instanceof Error ? error.message : 'Something went wrong');
        }
      })
      .finally(() => {
        if (!ignore) {
          setLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, []);

  async function handleAdd(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');

    if (name.trim() === '') {
      setError('Enter the skill.');
      return;
    }

    setAdding(true);
    try {
      const skill = await addSkill(name.trim());
      setSkills((current) => sortByName([...current, skill]));
      setName('');
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Something went wrong');
    } finally {
      setAdding(false);
    }
  }

  async function handleDelete(id: string) {
    setError('');
    try {
      await deleteSkill(id);
      setSkills((current) => current.filter((skill) => skill.id !== id));
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Something went wrong');
    }
  }

  return (
    <div className="skills-page">
      <h1>My skills</h1>
      <p className="skills-intro">
        Add the skills you have. JobTrail will compare them with job descriptions in a later
        version.
      </p>

      <form className="skills-form" onSubmit={handleAdd}>
        <label htmlFor="skill-name">New skill</label>
        <div className="skills-form-row">
          <input
            id="skill-name"
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            maxLength={MAX_SKILL_LENGTH}
            placeholder="For example: React"
          />
          <button type="submit" disabled={adding}>
            {adding ? 'Adding...' : 'Add skill'}
          </button>
        </div>
      </form>

      {error && (
        <p className="skills-error" role="alert">
          {error}
        </p>
      )}

      {loading ? (
        <p className="skills-muted">Loading...</p>
      ) : skills.length === 0 ? (
        <p className="skills-muted">You have not added any skills yet.</p>
      ) : (
        <ul className="skills-list">
          {skills.map((skill) => (
            <li key={skill.id}>
              <span>{skill.name}</span>
              <button
                type="button"
                aria-label={`Remove ${skill.name}`}
                onClick={() => handleDelete(skill.id)}
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
