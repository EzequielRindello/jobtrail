import { DndContext, type DragEndEvent } from '@dnd-kit/core';
import { useEffect, useRef, useState } from 'react';
import { searchApplications, changeApplicationStage } from '../api/applicationsApi';
import type { ApplicationSummary } from '../api/applicationsApi';
import {
  DATE_FIELDS,
  STAGES,
  type ApplicationFilterValues,
  type ApplicationStage,
  type DateField,
} from '../api/applicationTypes';
import AddApplicationForm from '../components/AddApplicationForm';
import ApplicationFilters from '../components/ApplicationFilters';
import ExportCsvButton from '../components/ExportCsvButton';
import Modal from '../components/Modal';
import FilterBar from '../components/filters/FilterBar';
import SortMenu from '../components/filters/SortMenu';
import KanbanColumn from '../components/kanban/KanbanColumn';
import { useBoardUpdates } from '../hooks/useBoardUpdates';
import { useToast } from '../hooks/useToast';
import { useUrlFilters } from '../hooks/useUrlFilters';
import { getErrorMessage } from '../utils/errorMessage';
import '../styles/KanbanPage.css';

// The orders the Sort menu offers. The sorting happens here, on the cards already loaded.
const SORT_OPTIONS = [
  { value: 'updated', label: 'Recently updated' },
  { value: 'created', label: 'Newest first' },
  { value: 'applied', label: 'Applied date' },
  { value: 'company', label: 'Company (A to Z)' },
  { value: 'title', label: 'Job title (A to Z)' },
] as const;

type SortOption = (typeof SORT_OPTIONS)[number]['value'];

// Everything the board keeps in the URL, with the value that means "not set".
const URL_DEFAULTS = {
  search: '',
  stage: '',
  dateField: 'saved',
  from: '',
  to: '',
  sort: 'updated',
};

// Keys that count as filters (for "Clear filters"); the sort order is not a filter.
const FILTER_KEYS = ['search', 'stage', 'dateField', 'from', 'to'] as const;

// "interview" -> "Interview", for the column titles and the mobile tabs.
function stageLabel(stage: string) {
  return stage.charAt(0).toUpperCase() + stage.slice(1);
}

// Returns a sorted copy (the list in state is never changed in place). Dates come as ISO text,
// so comparing the strings orders them by time. Cards without an applied date go last.
function sortApplications(list: ApplicationSummary[], sortBy: SortOption) {
  const sorted = [...list];

  switch (sortBy) {
    case 'company':
      return sorted.sort((a, b) => a.company.localeCompare(b.company));
    case 'title':
      return sorted.sort((a, b) => a.title.localeCompare(b.title));
    case 'created':
      return sorted.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    case 'applied':
      return sorted.sort((a, b) => (b.appliedOn ?? '').localeCompare(a.appliedOn ?? ''));
    default:
      return sorted.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }
}

export default function KanbanPage() {
  const [applications, setApplications] = useState<ApplicationSummary[]>([]);
  const [activeStage, setActiveStage] = useState(0);
  const [adding, setAdding] = useState(false);
  const [loadError, setLoadError] = useState('');
  // Changes after each save, to load the board again.
  const [reloads, setReloads] = useState(0);
  const boardRef = useRef<HTMLDivElement>(null);
  const { showToast } = useToast();

  const url = useUrlFilters(URL_DEFAULTS);
  const { search, stage: stageParam, dateField, from, to, sort } = url.values;

  // A hand-edited URL can hold anything, so unknown values fall back to the defaults.
  const filters: ApplicationFilterValues = {
    search,
    stage: STAGES.includes(stageParam as ApplicationStage) ? (stageParam as ApplicationStage) : '',
    dateField: DATE_FIELDS.includes(dateField as DateField) ? (dateField as DateField) : 'saved',
    from,
    to,
  };
  const sortBy: SortOption = SORT_OPTIONS.some((option) => option.value === sort)
    ? (sort as SortOption)
    : 'updated';

  // The filters as one string, so the effect below runs only when one of them really changes.
  const filterKey = JSON.stringify(filters);

  // Tells the user when the applications changed somewhere else (issue #11).
  const { markLocalChange, clearNotice } = useBoardUpdates(filters, applications, () =>
    setReloads((value) => value + 1),
  );

  // Loads the cards that match the filters.
  useEffect(() => {
    let ignore = false;
    // A check for updates that started before this load would compare against old cards.
    markLocalChange();

    searchApplications(JSON.parse(filterKey) as ApplicationFilterValues)
      .then((result) => {
        if (!ignore) {
          setApplications(result);
          setLoadError('');
          clearNotice();
        }
      })
      .catch((error) => {
        if (!ignore) {
          setLoadError(getErrorMessage(error));
        }
      });

    // A newer search replaces this one, even if this answer arrives later.
    return () => {
      ignore = true;
    };
  }, [filterKey, reloads, markLocalChange, clearNotice]);

  const sorted = sortApplications(applications, sortBy);

  function handleCreated() {
    setAdding(false);
    markLocalChange();
    showToast({ kind: 'success', message: 'Application saved.' });
    setReloads((value) => value + 1);
  }

  async function handleMove(id: string, newStage: ApplicationStage) {
    const application = applications.find((app) => app.id === id);

    if (!application || !STAGES.includes(newStage) || application.stage === newStage) return;

    markLocalChange();

    try {
      setApplications((current) =>
        current.map((app) => (app.id === id ? { ...app, stage: newStage } : app)),
      );

      const updated = await changeApplicationStage(id, newStage);

      setApplications((current) => current.map((app) => (app.id === id ? updated : app)));
      showToast({
        kind: 'success',
        message: `"${application.title}" moved to ${stageLabel(newStage)}.`,
      });
    } catch (error) {
      setApplications((current) =>
        current.map((app) => (app.id === id ? { ...app, stage: application.stage } : app)),
      );
      showToast({ kind: 'error', message: getErrorMessage(error) });
    }
  }

  function handleSort(value: SortOption) {
    url.update({ sort: value });
    const label = SORT_OPTIONS.find((option) => option.value === value)?.label ?? value;
    showToast({ id: 'sort', kind: 'info', message: `Sorted by ${label}.` });
  }

  function handleClearFilters() {
    url.clear([...FILTER_KEYS]);
    showToast({ id: 'filters', kind: 'info', message: 'Filters cleared.' });
  }

  function handleDragEnd(event: DragEndEvent) {
    if (!event.over) return;

    handleMove(String(event.active.id), String(event.over.id) as ApplicationStage);
  }

  const goToStage = (index: number) => {
    const board = boardRef.current;
    const column = board?.children[index] as HTMLElement | undefined;

    if (!board || !column) return;

    setActiveStage(index);

    board.scrollTo({
      left: column.offsetLeft - board.offsetLeft,
      behavior: 'smooth',
    });
  };

  const handleBoardScroll = () => {
    if (window.innerWidth > 600) return;

    const board = boardRef.current;
    if (!board) return;

    const columns = Array.from(board.children) as HTMLElement[];

    const activeIndex = columns.reduce((closest, column, index) => {
      const distance = Math.abs(column.offsetLeft - board.offsetLeft - board.scrollLeft);
      const closestDistance = Math.abs(
        columns[closest].offsetLeft - board.offsetLeft - board.scrollLeft,
      );

      return distance < closestDistance ? index : closest;
    }, 0);

    setActiveStage(activeIndex);
  };

  // dateField alone is not a filter: it only matters with a from or to date.
  const activeFilters = url.countActive(['search', 'stage', 'from', 'to']);

  return (
    <div className="kanban-page">
      <div className="kanban-toolbar">
        <div className="kanban-toolbar-top">
          <div>
            <h1>Jobs</h1>
            <p>Track and manage your job applications</p>
          </div>

          <div className="kanban-toolbar-actions">
            {/* Exports the same cards the board shows (same filters). */}
            <ExportCsvButton filters={filters} />

            <button
              className="kanban-add-button"
              type="button"
              onClick={() => setAdding(true)}
              disabled={adding}
            >
              + Add application
            </button>
          </div>
        </div>

        <div className="kanban-filters">
          <FilterBar activeCount={activeFilters} onClear={handleClearFilters}>
            {/* Order, right-aligned: Sort, Filter, Stage, Search. */}
            <SortMenu options={SORT_OPTIONS} value={sortBy} onChange={handleSort} />
            <ApplicationFilters values={filters} onChange={url.update} />
          </FilterBar>
        </div>

        {loadError && (
          <p className="kanban-status kanban-status-error" role="alert">
            {loadError}
          </p>
        )}
      </div>

      {adding && (
        <Modal title="Add application" onClose={() => setAdding(false)}>
          <AddApplicationForm onCreated={handleCreated} onCancel={() => setAdding(false)} />
        </Modal>
      )}

      <div className="kanban-mobile-tabs">
        {STAGES.map((stage, index) => (
          <button
            key={stage}
            type="button"
            className={activeStage === index ? 'active' : ''}
            onClick={() => goToStage(index)}
          >
            {stageLabel(stage)}
          </button>
        ))}
      </div>
      <DndContext onDragEnd={handleDragEnd}>
        <div className="kanban-board" ref={boardRef} onScroll={handleBoardScroll}>
          {STAGES.map((stage) => (
            <KanbanColumn
              key={stage}
              stage={stage}
              title={stageLabel(stage)}
              applications={sorted.filter((app) => app.stage === stage)}
              onMove={handleMove}
            />
          ))}
        </div>
      </DndContext>
    </div>
  );
}
