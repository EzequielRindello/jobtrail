import { useEffect, useState } from 'react';
import { addSkill, deleteSkill, getSkills, type Skill } from '../api/skillsApi';
import ConfirmDeleteModal from '../components/ConfirmDeleteModal';
import Modal from '../components/Modal';
import PageHeader from '../components/PageHeader';
import FilterBar from '../components/filters/FilterBar';
import SearchField from '../components/filters/SearchField';
import SortMenu from '../components/filters/SortMenu';
import { useToast } from '../hooks/useToast';
import { useUrlFilters } from '../hooks/useUrlFilters';
import { getErrorMessage } from '../utils/errorMessage';

import '../styles/Applications.css';
import '../styles/Skills.css';

const SORT_OPTIONS = [
  { value: 'az', label: 'Name (A to Z)' },
  { value: 'za', label: 'Name (Z to A)' },
] as const;

type SortOption = (typeof SORT_OPTIONS)[number]['value'];

// What the skills page keeps in the URL (same idea as the board, issue #49).
const URL_DEFAULTS = { search: '', sort: 'az' };

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
  // The Add skill modal: whether it is open, saving, and its own error message.
  const [adding, setAdding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  // The skill the user is being asked to confirm removing, if any.
  const [skillToDelete, setSkillToDelete] = useState<Skill | null>(null);
  const url = useUrlFilters(URL_DEFAULTS);
  const { showToast } = useToast();
  const sortBy: SortOption = url.values.sort === 'za' ? 'za' : 'az';

  // The skills list is small and already loaded, so search and sort happen here.
  const search = url.values.search.trim().toLowerCase();
  const visible = sortByName(skills.filter((skill) => skill.name.toLowerCase().includes(search)));
  if (sortBy === 'za') {
    visible.reverse();
  }

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
          setError(getErrorMessage(error));
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
    setFormError('');

    if (name.trim() === '') {
      setFormError('Enter the skill.');
      return;
    }

    setSaving(true);
    try {
      const skill = await addSkill(name.trim());
      setSkills((current) => sortByName([...current, skill]));
      closeModal();
      showToast({ kind: 'success', message: `"${skill.name}" added to your skills.` });
    } catch (error) {
      setFormError(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  }

  function closeModal() {
    setAdding(false);
    setName('');
    setFormError('');
  }

  // Runs when the user confirms in the delete modal. If it throws, the modal shows the error.
  async function handleDelete(skill: Skill) {
    await deleteSkill(skill.id);
    setSkills((current) => current.filter((item) => item.id !== skill.id));
    setSkillToDelete(null);
    showToast({ kind: 'success', message: `"${skill.name}" removed from your skills.` });
  }

  function handleSort(value: SortOption) {
    url.update({ sort: value });
    const label = SORT_OPTIONS.find((option) => option.value === value)?.label ?? value;
    showToast({ id: 'sort', kind: 'info', message: `Sorted by ${label}.` });
  }

  function handleClearFilters() {
    url.clear(['search']);
    showToast({ id: 'filters', kind: 'info', message: 'Filters cleared.' });
  }

  return (
    <div className="skills-page">
      <PageHeader
        title="My skills"
        subtitle="Add the skills you have. JobTrail will compare them with job descriptions in a later version."
        actions={
          <button
            type="button"
            className="applications-primary"
            onClick={() => setAdding(true)}
            disabled={adding}
          >
            + Add skill
          </button>
        }
      />

      {/* Same modal and form styles as "Add application" on the board. */}
      {adding && (
        <Modal title="Add skill" small onClose={closeModal}>
          <form className="applications-form" onSubmit={handleAdd}>
            <h2>Add skill</h2>

            <div className="applications-field">
              <label htmlFor="skill-name">
                Skill{' '}
                <span className="required-mark" aria-hidden="true">
                  *
                </span>
              </label>
              <input
                id="skill-name"
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                maxLength={MAX_SKILL_LENGTH}
                placeholder="For example: React"
                autoFocus
              />
            </div>

            {formError && (
              <p className="applications-error" role="alert">
                {formError}
              </p>
            )}

            <div className="applications-form-actions">
              <button type="button" className="applications-secondary" onClick={closeModal}>
                Cancel
              </button>
              <button type="submit" className="applications-primary" disabled={saving}>
                {saving ? 'Saving...' : 'Save skill'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {skillToDelete && (
        <ConfirmDeleteModal
          title="Remove skill"
          message={`"${skillToDelete.name}" will be removed from your skills.`}
          confirmLabel="Remove"
          onConfirm={() => handleDelete(skillToDelete)}
          onCancel={() => setSkillToDelete(null)}
        />
      )}

      {error && (
        <p className="skills-error" role="alert">
          {error}
        </p>
      )}

      {skills.length > 0 && (
        <div className="skills-filters">
          <FilterBar activeCount={url.countActive(['search'])} onClear={handleClearFilters}>
            <SortMenu options={SORT_OPTIONS} value={sortBy} onChange={handleSort} />
            <SearchField
              value={url.values.search}
              onChange={(value) => url.update({ search: value })}
              placeholder="Search skills"
              label="Search skills"
            />
          </FilterBar>
        </div>
      )}

      {loading ? (
        <p className="skills-muted">Loading...</p>
      ) : skills.length === 0 ? (
        <p className="skills-muted">You have not added any skills yet.</p>
      ) : visible.length === 0 ? (
        <p className="skills-muted">No skills match this search.</p>
      ) : (
        <ul className="skills-list">
          {visible.map((skill) => (
            <li key={skill.id}>
              <span>{skill.name}</span>
              <button
                type="button"
                aria-label={`Remove ${skill.name}`}
                onClick={() => setSkillToDelete(skill)}
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
