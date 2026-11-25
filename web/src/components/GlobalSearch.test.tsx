import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { searchApplications } from '../api/applicationsApi';
import type { ApplicationSummary } from '../api/applicationTypes';
import { getSkills } from '../api/skillsApi';
import GlobalSearch from './GlobalSearch';

// The component talks to the API through these two modules, so the tests replace them.
vi.mock('../api/applicationsApi', () => ({ searchApplications: vi.fn() }));
vi.mock('../api/skillsApi', () => ({ getSkills: vi.fn() }));

const mockSearchApplications = vi.mocked(searchApplications);
const mockGetSkills = vi.mocked(getSkills);

function makeApplication(id: number): ApplicationSummary {
  return {
    id: `app-${id}`,
    title: `Software Engineer ${id}`,
    company: `Company ${id}`,
    location: null,
    stage: 'saved',
    appliedOn: null,
    createdAt: '2026-11-20T12:00:00Z',
    updatedAt: '2026-11-20T12:00:00Z',
  };
}

function renderSearch() {
  render(
    <MemoryRouter>
      <GlobalSearch />
    </MemoryRouter>,
  );
}

// Types in the box; SearchField reports the text after its 300 ms pause.
function typeSearch(text: string) {
  fireEvent.change(screen.getByLabelText('Global search'), { target: { value: text } });
}

describe('GlobalSearch', () => {
  beforeEach(() => {
    mockSearchApplications.mockResolvedValue([]);
    mockGetSkills.mockResolvedValue([]);
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('asks the API for applications that match the text', async () => {
    mockSearchApplications.mockResolvedValue([makeApplication(1)]);
    renderSearch();

    typeSearch('  engineer ');

    expect(await screen.findByText('Software Engineer 1')).toBeTruthy();
    expect(mockSearchApplications).toHaveBeenCalledWith(
      expect.objectContaining({ search: 'engineer' }),
    );
  });

  it('links each application to its details page', async () => {
    mockSearchApplications.mockResolvedValue([makeApplication(7)]);
    renderSearch();

    typeSearch('engineer');

    const link = await screen.findByRole('link', { name: /Software Engineer 7/ });
    expect(link.getAttribute('href')).toBe('/applications/app-7');
  });

  it('shows at most 5 results per group', async () => {
    mockSearchApplications.mockResolvedValue([1, 2, 3, 4, 5, 6, 7].map(makeApplication));
    mockGetSkills.mockResolvedValue(
      ['React', 'Redux', 'React Native', 'Remix', 'REST', 'Regex'].map((name, i) => ({
        id: `skill-${i}`,
        name,
      })),
    );
    renderSearch();

    typeSearch('re');

    await screen.findByText('Software Engineer 1');
    expect(screen.queryByText('Software Engineer 6')).toBeNull();
    expect(screen.getByText('REST')).toBeTruthy();
    expect(screen.queryByText('Regex')).toBeNull();
  });

  it('filters skills by name in the browser and fetches them only once', async () => {
    mockGetSkills.mockResolvedValue([
      { id: 'skill-1', name: 'React' },
      { id: 'skill-2', name: 'SQL' },
    ]);
    renderSearch();

    typeSearch('rea');
    expect(await screen.findByText('React')).toBeTruthy();
    expect(screen.queryByText('SQL')).toBeNull();

    typeSearch('sq');
    expect(await screen.findByText('SQL')).toBeTruthy();
    expect(mockSearchApplications).toHaveBeenCalledTimes(2);
    expect(mockGetSkills).toHaveBeenCalledTimes(1);
  });

  it('says so when nothing matches', async () => {
    renderSearch();

    typeSearch('nothing');

    expect(await screen.findByText('No results found.')).toBeTruthy();
  });
});
