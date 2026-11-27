import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';

import { searchApplications } from '../api/applicationsApi';
import type { ApplicationSummary } from '../api/applicationTypes';
import { getSkills, type Skill } from '../api/skillsApi';
import SearchField from './filters/SearchField';

import '../styles/GlobalSearch.css';

// The dropdown is a quick jump, not a full list: the board's search shows every match.
const MAX_RESULTS_PER_GROUP = 5;

export default function GlobalSearch() {
  const [search, setSearch] = useState('');
  const [applications, setApplications] = useState<ApplicationSummary[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  // A user has few skills, so they are fetched once (on the first search) and filtered here
  // on every key. Applications can be many, so the API filters those on each search.
  const allSkills = useRef<Skill[] | null>(null);

  useEffect(() => {
    const query = search.trim();

    if (query === '') return;

    let ignore = false;

    Promise.all([
      searchApplications({
        search: query,
        stage: '',
        dateField: 'saved',
        from: '',
        to: '',
      }),
      allSkills.current ?? getSkills(),
    ])
      .then(([applicationResults, skillResults]) => {
        allSkills.current = skillResults;

        if (!ignore) {
          const term = query.toLowerCase();
          setApplications(applicationResults.slice(0, MAX_RESULTS_PER_GROUP));
          setSkills(
            skillResults
              .filter((skill) => skill.name.toLowerCase().includes(term))
              .slice(0, MAX_RESULTS_PER_GROUP),
          );
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
  }, [search]);

  useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  function handleSearch(value: string) {
    setIsOpen(value.trim() !== '');

    if (value === search) return;

    setSearch(value);
    setError('');
    setLoading(value.trim() !== '');

    // The previous results stay on screen while the next search runs, so the list does not
    // flash empty on every pause in typing. They are only dropped when the box is emptied.
    if (value.trim() === '') {
      setApplications([]);
      setSkills([]);
    }
  }

  const hasResults = applications.length > 0 || skills.length > 0;

  return (
    <div className="global-search" ref={searchRef} onFocus={() => setIsOpen(search.trim() !== '')}>
      <SearchField
        value={search}
        onChange={handleSearch}
        placeholder="Search"
        label="Global search"
      />

      {isOpen && search.trim() !== '' && (
        <div className="global-search-results">
          {/* Only the first search shows this; later ones keep the previous results visible. */}
          {loading && !hasResults && <p role="status">Searching...</p>}

          {error && (
            <p className="global-search-error" role="alert">
              {error}
            </p>
          )}

          {!loading && !error && !hasResults && <p>No results found.</p>}

          {!error && applications.length > 0 && (
            <section className="global-search-group">
              <h3>Applications</h3>

              {applications.map((application) => (
                <Link
                  key={application.id}
                  className="global-search-result"
                  to={`/applications/${application.id}`}
                  onClick={() => handleSearch('')}
                >
                  <span>{application.title}</span>
                  <small>{application.company}</small>
                </Link>
              ))}
            </section>
          )}

          {!error && skills.length > 0 && (
            <section className="global-search-group">
              <h3>Skills</h3>

              {skills.map((skill) => (
                <Link
                  key={skill.id}
                  className="global-search-result"
                  to={`/skills?search=${encodeURIComponent(skill.name)}`}
                  onClick={() => handleSearch('')}
                >
                  <span>{skill.name}</span>
                </Link>
              ))}
            </section>
          )}
        </div>
      )}
    </div>
  );
}
