import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';

import { searchApplications } from '../api/applicationsApi';
import type { ApplicationSummary } from '../api/applicationTypes';
import { getSkills, type Skill } from '../api/skillsApi';
import SearchField from './filters/SearchField';

import '../styles/GlobalSearch.css';

export default function GlobalSearch() {
  const [search, setSearch] = useState('');
  const [applications, setApplications] = useState<ApplicationSummary[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

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
      getSkills(),
    ])
      .then(([applicationResults, skillResults]) => {
        if (!ignore) {
          setApplications(applicationResults);
          setSkills(
            skillResults.filter((skill) => skill.name.toLowerCase().includes(query.toLowerCase())),
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
    setApplications([]);
    setSkills([]);
    setError('');
    setLoading(value.trim() !== '');
  }

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
          {loading && <p role="status">Searching...</p>}

          {error && (
            <p className="global-search-error" role="alert">
              {error}
            </p>
          )}

          {!loading && !error && applications.length === 0 && skills.length === 0 && (
            <p>No results found.</p>
          )}

          {!loading && !error && applications.length > 0 && (
            <section className="global-search-group">
              <h3>Applications</h3>

              {applications.map((application) => (
                // TODO: Navigate directly to the application details page once implemented.
                <Link
                  key={application.id}
                  className="global-search-result"
                  to={`/kanban?search=${encodeURIComponent(application.title)}&stage=${application.stage}`}
                  onClick={() => handleSearch('')}
                >
                  <span>{application.title}</span>
                  <small>{application.company}</small>
                </Link>
              ))}
            </section>
          )}

          {!loading && !error && skills.length > 0 && (
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
