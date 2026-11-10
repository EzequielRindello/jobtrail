// Reads a job post from the structured data that job sites publish for search engines:
// <script type="application/ld+json"> blocks with a schema.org JobPosting
// (https://schema.org/JobPosting). Sites write it in several shapes, so every field below
// accepts the variants seen in practice.
//
// This file is pure (no DOM, no chrome APIs), so it is unit-tested in extractJob.test.ts.

export interface ExtractedJob {
  title: string;
  company: string;
  location?: string;
  url?: string;
  description?: string;
  salaryRange?: string;
}

// Same limits as the API (ApplicationLimits.cs), so a long field never blocks the save.
const LIMITS = {
  title: 200,
  company: 200,
  location: 200,
  url: 2048,
  description: 100_000,
  salaryRange: 100,
};

type Json = Record<string, unknown>;

// jsonLdTexts: the text of every ld+json script on the page. htmlToText: turns the HTML
// description into plain text (the popup passes one that uses the browser's DOMParser).
export function extractJob(
  jsonLdTexts: string[],
  pageUrl: string,
  htmlToText: (html: string) => string,
): ExtractedJob | null {
  const posting = jsonLdTexts.flatMap(parseJson).flatMap(flatten).find(isJobPosting);
  if (!posting) {
    return null;
  }

  const description = text(posting.description);
  const postingUrl = text(posting.url);

  return {
    title: limit(text(posting.title) ?? text(posting.name), LIMITS.title) ?? '',
    company: limit(readCompany(posting.hiringOrganization), LIMITS.company) ?? '',
    location: limit(readLocation(posting), LIMITS.location),
    url: limit(postingUrl && isHttpUrl(postingUrl) ? postingUrl : pageUrl, LIMITS.url),
    description: limit(description ? htmlToText(description) : undefined, LIMITS.description),
    salaryRange: limit(readSalary(posting.baseSalary), LIMITS.salaryRange),
  };
}

function parseJson(raw: string): unknown[] {
  try {
    return [JSON.parse(raw)];
  } catch {
    // A broken block on the page should not hide a valid one next to it.
    return [];
  }
}

// One script can hold a single object, an array of objects, or an "@graph" list.
function flatten(value: unknown): Json[] {
  if (Array.isArray(value)) {
    return value.flatMap(flatten);
  }
  if (!isObject(value)) {
    return [];
  }
  return [value, ...flatten(value['@graph'])];
}

function isJobPosting(item: Json): boolean {
  const types = toArray(item['@type']);
  return types.some((type) => typeof type === 'string' && type.endsWith('JobPosting'));
}

// "Fictional Labs" or { "@type": "Organization", "name": "Fictional Labs" }.
function readCompany(value: unknown): string | undefined {
  const first = toArray(value)[0];
  return isObject(first) ? text(first.name) : text(first);
}

// One place or several, each a text or a PostalAddress. Remote jobs say so in jobLocationType.
function readLocation(posting: Json): string | undefined {
  const places = toArray(posting.jobLocation)
    .map((place) => (isObject(place) ? readAddress(place.address) : text(place)))
    .filter((place): place is string => Boolean(place));

  const isRemote = toArray(posting.jobLocationType).some(
    (type) => text(type)?.toUpperCase() === 'TELECOMMUTE',
  );
  const parts = [...(isRemote ? ['Remote'] : []), ...new Set(places)];

  return parts.length > 0 ? parts.join('; ') : undefined;
}

function readAddress(address: unknown): string | undefined {
  if (!isObject(address)) {
    return text(address);
  }

  const country = isObject(address.addressCountry)
    ? text(address.addressCountry.name)
    : text(address.addressCountry);
  const parts = [text(address.addressLocality), text(address.addressRegion), country].filter(
    Boolean,
  );

  return parts.length > 0 ? parts.join(', ') : undefined;
}

// MonetaryAmount: { currency, value: 50000 } or value: { minValue, maxValue, unitText }.
function readSalary(value: unknown): string | undefined {
  const salary = toArray(value)[0];
  if (!isObject(salary)) {
    return undefined;
  }

  const amount = isObject(salary.value) ? salary.value : { value: salary.value };
  const min = number(amount.minValue) ?? number(amount.value);
  const max = number(amount.maxValue);
  if (min === undefined && max === undefined) {
    return undefined;
  }

  const range = [min, max]
    .filter((n): n is number => n !== undefined)
    .filter((n, index, all) => all.indexOf(n) === index)
    .map((n) => n.toLocaleString('en-US'))
    .join('-');
  const currency = text(salary.currency);
  const unit = text(amount.unitText) ?? text(salary.unitText);

  return [currency, range].filter(Boolean).join(' ') + (unit ? ` / ${unit.toUpperCase()}` : '');
}

function text(value: unknown): string | undefined {
  if (typeof value !== 'string' && typeof value !== 'number') {
    return undefined;
  }
  const trimmed = String(value).trim();
  return trimmed === '' ? undefined : trimmed;
}

function number(value: unknown): number | undefined {
  const parsed =
    typeof value === 'number' ? value : typeof value === 'string' ? Number(value) : NaN;
  return Number.isFinite(parsed) ? parsed : undefined;
}

function limit(value: string | undefined, maxLength: number): string | undefined {
  return value === undefined ? undefined : value.slice(0, maxLength).trim();
}

function isHttpUrl(value: string): boolean {
  return /^https?:\/\//i.test(value);
}

function isObject(value: unknown): value is Json {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function toArray(value: unknown): unknown[] {
  if (value === undefined || value === null) {
    return [];
  }
  return Array.isArray(value) ? value : [value];
}
