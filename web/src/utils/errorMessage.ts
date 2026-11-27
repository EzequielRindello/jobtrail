// The text shown when an error has no message a user could read.
export const DEFAULT_ERROR = 'Something went wrong. Please try again.';

// The one place that turns any caught error into the message the user sees. The API client
// already turns API and network failures into readable Errors, so only the unknown ones fall
// back to the default text.
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim() !== '') {
    return error.message;
  }

  return DEFAULT_ERROR;
}
