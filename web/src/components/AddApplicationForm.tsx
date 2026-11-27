import { useState } from 'react';
import { createApplication } from '../api/applicationsApi';
import { STAGES, type ApplicationStage } from '../api/applicationTypes';
import { getErrorMessage } from '../utils/errorMessage';

import '../styles/Applications.css';

interface AddApplicationFormProps {
  onCreated: () => void;
  onCancel: () => void;
}

// Fields the user leaves empty are not sent, so the API stores null instead of "".
function optional(form: FormData, name: string): string | undefined {
  const value = String(form.get(name) ?? '').trim();
  return value === '' ? undefined : value;
}

export default function AddApplicationForm({ onCreated, onCancel }: AddApplicationFormProps) {
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');

    const form = new FormData(event.currentTarget);
    const title = String(form.get('title')).trim();
    const company = String(form.get('company')).trim();

    if (title === '' || company === '') {
      setError('Enter the job title and the company.');
      return;
    }

    setSaving(true);
    try {
      await createApplication({
        title,
        company,
        location: optional(form, 'location'),
        url: optional(form, 'url'),
        salaryRange: optional(form, 'salaryRange'),
        notes: optional(form, 'notes'),
        stage: String(form.get('stage')) as ApplicationStage,
      });
      onCreated();
    } catch (error) {
      setError(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="applications-form" onSubmit={handleSubmit}>
      <h2>Add application</h2>

      <div className="applications-form-grid">
        <div className="applications-field">
          <label htmlFor="add-title">
            Job title{' '}
            <span className="required-mark" aria-hidden="true">
              *
            </span>
          </label>
          <input id="add-title" name="title" type="text" maxLength={200} required />
        </div>

        <div className="applications-field">
          <label htmlFor="add-company">
            Company{' '}
            <span className="required-mark" aria-hidden="true">
              *
            </span>
          </label>
          <input id="add-company" name="company" type="text" maxLength={200} required />
        </div>

        <div className="applications-field">
          <label htmlFor="add-location">Location</label>
          <input id="add-location" name="location" type="text" maxLength={200} />
        </div>

        <div className="applications-field">
          <label htmlFor="add-salary">Salary</label>
          <input id="add-salary" name="salaryRange" type="text" maxLength={100} />
        </div>

        <div className="applications-field">
          <label htmlFor="add-url">Link</label>
          <input id="add-url" name="url" type="url" maxLength={2048} placeholder="https://" />
        </div>

        <div className="applications-field">
          <label htmlFor="add-stage">Stage</label>
          <select id="add-stage" name="stage" defaultValue="saved">
            {STAGES.map((stage) => (
              <option key={stage} value={stage}>
                {stage.charAt(0).toUpperCase() + stage.slice(1)}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="applications-field">
        <label htmlFor="add-notes">Notes</label>
        <textarea id="add-notes" name="notes" rows={3} maxLength={10000} />
      </div>

      {error && (
        <p className="applications-error" role="alert">
          {error}
        </p>
      )}

      <div className="applications-form-actions">
        <button type="button" className="applications-secondary" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="applications-primary" disabled={saving}>
          {saving ? 'Saving...' : 'Save application'}
        </button>
      </div>
    </form>
  );
}
