import { describe, expect, it } from 'vitest';
import { extractJob } from './extractJob';

const PAGE_URL = 'https://jobs.example.com/view/123?ref=search';

// Tests only need the tags gone; the popup uses the browser's DOMParser instead.
const stripTags = (html: string) =>
  html
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

function extract(...blocks: unknown[]) {
  return extractJob(
    blocks.map((block) => (typeof block === 'string' ? block : JSON.stringify(block))),
    PAGE_URL,
    stripTags,
  );
}

const basicPosting = {
  '@context': 'https://schema.org',
  '@type': 'JobPosting',
  title: 'Backend Developer',
  hiringOrganization: { '@type': 'Organization', name: 'Fictional Labs' },
  jobLocation: {
    '@type': 'Place',
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Austin',
      addressRegion: 'TX',
      addressCountry: 'US',
    },
  },
  description: '<p>Build <strong>APIs</strong> in C#.</p>',
  url: 'https://jobs.example.com/view/123',
};

describe('extractJob', () => {
  it('reads every field of a basic JobPosting', () => {
    expect(extract(basicPosting)).toEqual({
      title: 'Backend Developer',
      company: 'Fictional Labs',
      location: 'Austin, TX, US',
      url: 'https://jobs.example.com/view/123',
      description: 'Build APIs in C#.',
      salaryRange: undefined,
    });
  });

  it('returns null when the page has no JobPosting', () => {
    expect(extract({ '@type': 'WebSite', name: 'Example' })).toBeNull();
    expect(extract()).toBeNull();
  });

  it('skips broken JSON and keeps looking', () => {
    expect(extract('{ not json', basicPosting)?.title).toBe('Backend Developer');
  });

  it('finds the posting inside an array or an @graph list', () => {
    expect(extract([{ '@type': 'Organization', name: 'x' }, basicPosting])?.title).toBe(
      'Backend Developer',
    );
    expect(
      extract({
        '@context': 'https://schema.org',
        '@graph': [{ '@type': 'BreadcrumbList' }, basicPosting],
      })?.title,
    ).toBe('Backend Developer');
  });

  it('accepts @type as an array or a full schema.org URL', () => {
    expect(extract({ ...basicPosting, '@type': ['Thing', 'JobPosting'] })?.title).toBe(
      'Backend Developer',
    );
    expect(extract({ ...basicPosting, '@type': 'http://schema.org/JobPosting' })?.title).toBe(
      'Backend Developer',
    );
  });

  it('accepts the company as plain text', () => {
    expect(extract({ ...basicPosting, hiringOrganization: 'Example Co' })?.company).toBe(
      'Example Co',
    );
  });

  it('joins several locations and marks remote jobs', () => {
    const job = extract({
      ...basicPosting,
      jobLocationType: 'TELECOMMUTE',
      jobLocation: [
        {
          address: {
            addressLocality: 'Buenos Aires',
            addressCountry: { '@type': 'Country', name: 'AR' },
          },
        },
        { address: 'Madrid, Spain' },
        { address: 'Madrid, Spain' },
      ],
    });

    expect(job?.location).toBe('Remote; Buenos Aires, AR; Madrid, Spain');
  });

  it('marks a remote job with no address as Remote', () => {
    const { jobLocation, ...remote } = basicPosting;
    void jobLocation;

    expect(extract({ ...remote, jobLocationType: ['TELECOMMUTE'] })?.location).toBe('Remote');
  });

  it('writes the salary range as text', () => {
    const range = {
      currency: 'USD',
      value: { '@type': 'QuantitativeValue', minValue: 50000, maxValue: 70000, unitText: 'YEAR' },
    };
    const single = { currency: 'EUR', value: { value: '45000', unitText: 'year' } };
    const plain = { currency: 'USD', value: 30 };

    expect(extract({ ...basicPosting, baseSalary: range })?.salaryRange).toBe(
      'USD 50,000-70,000 / YEAR',
    );
    expect(extract({ ...basicPosting, baseSalary: single })?.salaryRange).toBe('EUR 45,000 / YEAR');
    expect(extract({ ...basicPosting, baseSalary: plain })?.salaryRange).toBe('USD 30');
    expect(
      extract({ ...basicPosting, baseSalary: { currency: 'USD' } })?.salaryRange,
    ).toBeUndefined();
  });

  it('uses the page URL when the posting has no valid url', () => {
    const { url, ...noUrl } = basicPosting;
    void url;

    expect(extract(noUrl)?.url).toBe(PAGE_URL);
    expect(extract({ ...basicPosting, url: '/view/123' })?.url).toBe(PAGE_URL);
  });

  it('leaves missing fields empty and cuts fields longer than the API allows', () => {
    const job = extract({ '@type': 'JobPosting', title: 'x'.repeat(300) });

    expect(job?.title).toHaveLength(200);
    expect(job?.company).toBe('');
    expect(job?.location).toBeUndefined();
    expect(job?.description).toBeUndefined();
  });
});
