import { ArrowLeft } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { deleteApplication, getApplication, saveApplication } from '../api/applicationsApi';
import type {
  ApplicationDetails,
  ApplicationStage,
  SaveApplicationRequest,
} from '../api/applicationTypes';
import ConfirmDeleteModal from '../components/ConfirmDeleteModal';
import { useToast } from '../hooks/useToast';
import { getErrorMessage } from '../utils/errorMessage';

import '../styles/Applications.css';
import '../styles/ApplicationDetails.css';

// The editable fields as the inputs hold them: always text, "" when empty.
type Draft = Record<keyof SaveApplicationRequest, string>;

// Same limits as the API (ApplicationLimits.cs) and the Add application form.
const LIMITS = {
  title: 200,
  company: 200,
  location: 200,
  url: 2048,
  description: 100_000,
  salaryRange: 100,
  contactName: 100,
  contactEmail: 256,
  resumeVersion: 100,
  notes: 10_000,
};

function stageLabel(stage: ApplicationStage) {
  return stage.charAt(0).toUpperCase() + stage.slice(1);
}

function toDraft(application: ApplicationDetails): Draft {
  return {
    title: application.title,
    company: application.company,
    location: application.location ?? '',
    url: application.url ?? '',
    description: application.description ?? '',
    salaryRange: application.salaryRange ?? '',
    contactName: application.contactName ?? '',
    contactEmail: application.contactEmail ?? '',
    resumeVersion: application.resumeVersion ?? '',
    notes: application.notes ?? '',
    appliedOn: application.appliedOn ?? '',
  };
}

// PUT replaces every field, so all of them are sent; an empty one is sent as null (cleared).
function toRequest(draft: Draft): SaveApplicationRequest {
  const clean = (value: string) => (value.trim() === '' ? null : value.trim());

  return {
    title: draft.title.trim(),
    company: draft.company.trim(),
    location: clean(draft.location),
    url: clean(draft.url),
    // The description keeps its own spacing and line breaks.
    description: draft.description.trim() === '' ? null : draft.description,
    salaryRange: clean(draft.salaryRange),
    contactName: clean(draft.contactName),
    contactEmail: clean(draft.contactEmail),
    resumeVersion: clean(draft.resumeVersion),
    notes: clean(draft.notes),
    appliedOn: clean(draft.appliedOn),
  };
}

// How many stage changes show before "Show earlier changes".
const HISTORY_PREVIEW = 5;

// "Nov 23, 2026" for a plain yyyy-mm-dd day, built as a local date so it never shifts a day.
function formatDay(day: string) {
  const [year, month, date] = day.split('-').map(Number);
  return new Date(year, month - 1, date).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

// "Nov 24, 7:12 PM" for a moment in time, in the user's language and time zone.
function formatMoment(value: string) {
  return new Date(value).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

// The page of one application (issue #32): everything stored about it, its stage history,
// the saved job description, and the Edit and Delete actions.
export default function ApplicationDetailsPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [application, setApplication] = useState<ApplicationDetails | null>(null);
  const [loadError, setLoadError] = useState('');
  const [draft, setDraft] = useState<Draft | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [showAllHistory, setShowAllHistory] = useState(false);

  useEffect(() => {
    let ignore = false;

    getApplication(id)
      .then((loaded) => {
        if (!ignore) {
          setApplication(loaded);
        }
      })
      .catch((error) => {
        if (!ignore) {
          setLoadError(getErrorMessage(error));
        }
      });

    return () => {
      ignore = true;
    };
  }, [id]);

  function startEditing() {
    if (!application) return;
    setDraft(toDraft(application));
    setSaveError('');
  }

  function updateDraft(field: keyof Draft, value: string) {
    setDraft((current) => (current ? { ...current, [field]: value } : current));
  }

  async function handleSave(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!draft) return;
    setSaveError('');

    if (draft.title.trim() === '' || draft.company.trim() === '') {
      setSaveError('Enter the job title and the company.');
      return;
    }

    setSaving(true);
    try {
      const saved = await saveApplication(id, toRequest(draft));
      setApplication(saved);
      setDraft(null);
      showToast({ kind: 'success', message: 'Changes saved.' });
    } catch (error) {
      // The draft is kept, so nothing the user typed is lost.
      setSaveError(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  }

  // Runs when the user confirms. If it throws, the confirmation modal shows the error.
  async function handleDelete() {
    await deleteApplication(id);
    showToast({ kind: 'success', message: 'Application deleted.' });
    navigate('/kanban');
  }

  if (loadError) {
    return (
      <div className="details-page">
        <Link to="/kanban" className="details-back">
          <ArrowLeft size={16} aria-hidden="true" /> Back to the board
        </Link>
        <p className="applications-error" role="alert">
          {loadError}
        </p>
      </div>
    );
  }

  if (!application) {
    return (
      <div className="details-page">
        <p className="applications-message">Loading...</p>
      </div>
    );
  }

  // The details with a value are listed; the empty ones are named together in one line.
  const fields = [
    {
      label: 'Link',
      value: application.url && (
        <a href={application.url} target="_blank" rel="noopener noreferrer">
          Open the job post
        </a>
      ),
    },
    { label: 'Applied on', value: application.appliedOn && formatDay(application.appliedOn) },
    { label: 'Salary', value: application.salaryRange },
    { label: 'Contact', value: application.contactName },
    {
      label: 'Email',
      value: application.contactEmail && (
        <a href={`mailto:${application.contactEmail}`} target="_blank" rel="noopener noreferrer">
          {application.contactEmail}
        </a>
      ),
    },
    { label: 'Resume', value: application.resumeVersion },
    {
      label: 'Notes',
      value: application.notes && <span className="details-text">{application.notes}</span>,
    },
  ];
  const filledFields = fields.filter((field) => field.value);
  const missingFields = fields.filter((field) => !field.value);

  // A long history shows its latest changes first, still oldest to newest.
  const hiddenChanges = showAllHistory
    ? 0
    : Math.max(application.history.length - HISTORY_PREVIEW, 0);
  const visibleHistory = application.history.slice(hiddenChanges);

  return (
    <div className="details-page">
      <Link to="/kanban" className="details-back">
        <ArrowLeft size={16} aria-hidden="true" /> Back to the board
      </Link>

      <div className="details-header">
        <div>
          {/* The stage sits next to the title: it describes the whole application. */}
          <div className="details-title-row">
            <h1>{application.title}</h1>
            <span className="details-stage">{stageLabel(application.stage)}</span>
          </div>
          <p className="details-subtitle">
            {application.company}
            {application.location && ` · ${application.location}`}
          </p>
        </div>

        {!draft && (
          <div className="details-actions">
            <button
              type="button"
              className="applications-text-button"
              onClick={() => setDeleting(true)}
            >
              Delete
            </button>
            <button type="button" className="applications-primary" onClick={startEditing}>
              Edit
            </button>
          </div>
        )}
      </div>

      {draft ? (
        <form className="applications-form details-form" onSubmit={handleSave}>
          <h2>Edit application</h2>

          <div className="applications-form-grid">
            <div className="applications-field">
              <label htmlFor="edit-title">
                Job title{' '}
                <span className="required-mark" aria-hidden="true">
                  *
                </span>
              </label>
              <input
                id="edit-title"
                type="text"
                value={draft.title}
                onChange={(event) => updateDraft('title', event.target.value)}
                maxLength={LIMITS.title}
                required
              />
            </div>

            <div className="applications-field">
              <label htmlFor="edit-company">
                Company{' '}
                <span className="required-mark" aria-hidden="true">
                  *
                </span>
              </label>
              <input
                id="edit-company"
                type="text"
                value={draft.company}
                onChange={(event) => updateDraft('company', event.target.value)}
                maxLength={LIMITS.company}
                required
              />
            </div>

            <div className="applications-field">
              <label htmlFor="edit-location">Location</label>
              <input
                id="edit-location"
                type="text"
                value={draft.location}
                onChange={(event) => updateDraft('location', event.target.value)}
                maxLength={LIMITS.location}
              />
            </div>

            <div className="applications-field">
              <label htmlFor="edit-url">Link</label>
              <input
                id="edit-url"
                type="url"
                value={draft.url}
                onChange={(event) => updateDraft('url', event.target.value)}
                maxLength={LIMITS.url}
                placeholder="https://"
              />
            </div>

            <div className="applications-field">
              <label htmlFor="edit-applied">Applied on</label>
              <input
                id="edit-applied"
                type="date"
                value={draft.appliedOn}
                onChange={(event) => updateDraft('appliedOn', event.target.value)}
              />
            </div>

            <div className="applications-field">
              <label htmlFor="edit-salary">Salary</label>
              <input
                id="edit-salary"
                type="text"
                value={draft.salaryRange}
                onChange={(event) => updateDraft('salaryRange', event.target.value)}
                maxLength={LIMITS.salaryRange}
              />
            </div>

            <div className="applications-field">
              <label htmlFor="edit-contact-name">Contact name</label>
              <input
                id="edit-contact-name"
                type="text"
                value={draft.contactName}
                onChange={(event) => updateDraft('contactName', event.target.value)}
                maxLength={LIMITS.contactName}
              />
            </div>

            <div className="applications-field">
              <label htmlFor="edit-contact-email">Contact email</label>
              <input
                id="edit-contact-email"
                type="email"
                value={draft.contactEmail}
                onChange={(event) => updateDraft('contactEmail', event.target.value)}
                maxLength={LIMITS.contactEmail}
              />
            </div>

            <div className="applications-field">
              <label htmlFor="edit-resume">Resume version</label>
              <input
                id="edit-resume"
                type="text"
                value={draft.resumeVersion}
                onChange={(event) => updateDraft('resumeVersion', event.target.value)}
                maxLength={LIMITS.resumeVersion}
              />
            </div>
          </div>

          <div className="applications-field">
            <label htmlFor="edit-notes">Notes</label>
            <textarea
              id="edit-notes"
              rows={4}
              value={draft.notes}
              onChange={(event) => updateDraft('notes', event.target.value)}
              maxLength={LIMITS.notes}
            />
          </div>

          <div className="applications-field">
            <label htmlFor="edit-description">Saved job description</label>
            <textarea
              id="edit-description"
              rows={10}
              value={draft.description}
              onChange={(event) => updateDraft('description', event.target.value)}
              maxLength={LIMITS.description}
            />
          </div>

          {saveError && (
            <p className="applications-error" role="alert">
              {saveError}
            </p>
          )}

          <div className="applications-form-actions">
            <button
              type="button"
              className="applications-secondary"
              onClick={() => setDraft(null)}
              disabled={saving}
            >
              Cancel
            </button>
            <button type="submit" className="applications-primary" disabled={saving}>
              {saving ? 'Saving...' : 'Save changes'}
            </button>
          </div>
        </form>
      ) : (
        <div className="details-layout">
          <section className="details-main" aria-labelledby="description-title">
            <h2 id="description-title">Job description</h2>
            {/* Plain text only: React escapes it, so HTML from a job post is never run. */}
            {application.description ? (
              <p className="details-text details-description">{application.description}</p>
            ) : (
              <div className="details-placeholder">
                <p>No description saved for this job.</p>
                <button type="button" className="details-inline-button" onClick={startEditing}>
                  Add a description
                </button>
              </div>
            )}
          </section>

          <aside className="details-side">
            <section className="details-panel" aria-labelledby="details-title">
              <h2 id="details-title">Details</h2>
              {filledFields.length > 0 && (
                <dl className="details-list">
                  {filledFields.map((field) => (
                    <div key={field.label} className="details-row">
                      <dt>{field.label}</dt>
                      <dd>{field.value}</dd>
                    </div>
                  ))}
                </dl>
              )}
              {/* The empty fields share one line instead of a column of "Not set". */}
              {missingFields.length > 0 && (
                <p className="details-missing">
                  Not set: {missingFields.map((field) => field.label).join(', ')}.{' '}
                  <button type="button" className="details-inline-button" onClick={startEditing}>
                    Add
                  </button>
                </p>
              )}
            </section>

            <section className="details-panel" aria-labelledby="history-title">
              <h2 id="history-title">
                Stage history <span className="details-count">{application.history.length}</span>
              </h2>
              {hiddenChanges > 0 && (
                <button
                  type="button"
                  className="details-inline-button details-show-all"
                  onClick={() => setShowAllHistory(true)}
                >
                  Show {hiddenChanges} earlier {hiddenChanges === 1 ? 'change' : 'changes'}
                </button>
              )}
              <ol className="details-history">
                {visibleHistory.map((change, index) => (
                  <li key={`${change.changedAt}-${index}`}>
                    <span className="details-history-stage">
                      {change.fromStage
                        ? `${stageLabel(change.fromStage)} to ${stageLabel(change.toStage)}`
                        : `Added as ${stageLabel(change.toStage)}`}
                    </span>
                    <time dateTime={change.changedAt}>{formatMoment(change.changedAt)}</time>
                  </li>
                ))}
              </ol>
            </section>
          </aside>
        </div>
      )}

      {deleting && (
        <ConfirmDeleteModal
          title="Delete application"
          message={`"${application.title}" at ${application.company} will be deleted with its history.`}
          onConfirm={handleDelete}
          onCancel={() => setDeleting(false)}
        />
      )}
    </div>
  );
}
