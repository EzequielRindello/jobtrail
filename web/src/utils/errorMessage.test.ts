import { describe, expect, it } from 'vitest';

import { DEFAULT_ERROR, getErrorMessage } from './errorMessage';

describe('getErrorMessage', () => {
  it('shows the message of an Error', () => {
    expect(getErrorMessage(new Error('Title is required.'))).toBe('Title is required.');
  });

  it('falls back to the default text for an Error without a message', () => {
    expect(getErrorMessage(new Error('   '))).toBe(DEFAULT_ERROR);
  });

  it('falls back to the default text for anything that is not an Error', () => {
    expect(getErrorMessage('oops')).toBe(DEFAULT_ERROR);
    expect(getErrorMessage(undefined)).toBe(DEFAULT_ERROR);
  });
});
