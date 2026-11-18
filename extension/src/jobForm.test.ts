import { describe, expect, it } from 'vitest';
import { LIMITS } from './extractJob';
import { emptyForm, fromJob, toJob, validateJobForm } from './jobForm';

const valid = { ...emptyForm(), title: 'Backend Developer', company: 'Fictional Labs' };

describe('fromJob', () => {
  it('fills the form with the extracted job and leaves missing fields empty', () => {
    const form = fromJob({ title: 'QA Engineer', company: 'Example Co', location: 'Remote' });

    expect(form).toEqual({
      title: 'QA Engineer',
      company: 'Example Co',
      location: 'Remote',
      salaryRange: '',
      url: '',
      description: '',
    });
  });
});

describe('validateJobForm', () => {
  it('accepts a title and a company alone', () => {
    expect(validateJobForm(valid)).toEqual({});
  });

  it('requires the title and the company, ignoring blank spaces', () => {
    const errors = validateJobForm({ ...emptyForm(), title: '   ', company: '' });

    expect(errors.title).toBe('Enter the job title.');
    expect(errors.company).toBe('Enter the company.');
  });

  it('accepts an empty link, an http link and an https link', () => {
    expect(validateJobForm({ ...valid, url: '' }).url).toBeUndefined();
    expect(validateJobForm({ ...valid, url: 'http://jobs.example.com/1' }).url).toBeUndefined();
    expect(validateJobForm({ ...valid, url: ' https://jobs.example.com/1 ' }).url).toBeUndefined();
  });

  it('rejects a link without http or https', () => {
    expect(validateJobForm({ ...valid, url: 'jobs.example.com' }).url).toBeDefined();
    expect(validateJobForm({ ...valid, url: 'javascript:alert(1)' }).url).toBeDefined();
    expect(validateJobForm({ ...valid, url: 'ftp://jobs.example.com' }).url).toBeDefined();
  });

  it('rejects a field longer than the API allows', () => {
    const errors = validateJobForm({
      ...valid,
      title: 'a'.repeat(LIMITS.title + 1),
      salaryRange: 'b'.repeat(LIMITS.salaryRange + 1),
    });

    expect(errors.title).toBe(`Use up to ${LIMITS.title} characters.`);
    expect(errors.salaryRange).toBe(`Use up to ${LIMITS.salaryRange} characters.`);
    expect(errors.company).toBeUndefined();
  });
});

describe('toJob', () => {
  it('trims the text and leaves out the empty optional fields', () => {
    const job = toJob({ ...valid, title: '  Backend Developer ', location: '   ', url: '' });

    expect(job.title).toBe('Backend Developer');
    expect(job.location).toBeUndefined();
    expect(job.url).toBeUndefined();
    expect(job.description).toBeUndefined();
  });

  it('keeps the edits the user made over the extracted values', () => {
    const extracted = { title: 'Dev', company: 'Wrong Co', location: 'Old City' };
    const edited = { ...fromJob(extracted), company: 'Right Co', location: 'New City' };

    expect(toJob(edited)).toMatchObject({
      title: 'Dev',
      company: 'Right Co',
      location: 'New City',
    });
  });
});
