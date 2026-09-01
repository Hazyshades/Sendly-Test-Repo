class UploadHttpError extends Error {
  constructor(status) {
    super(`Upload failed with status ${status}`);
    this.name = 'UploadHttpError';
    this.status = status;
  }
}

// Explicit substrings that reliably indicate a network/connectivity failure.
// Intentionally narrow: generic JS parse errors (e.g. "Unexpected token < in JSON")
// must NOT match and must fall through to the safe fallback.
const NETWORK_MESSAGE_SUBSTRINGS = [
  'failed to fetch',
  'fetch failed',
  'networkerror',
  'network error',
  'load failed',
  'offline',
];

function isNetworkError(error) {
  if (!(error instanceof Error)) return false;

  const message = error.message.toLowerCase();
  return NETWORK_MESSAGE_SUBSTRINGS.some((s) => message.includes(s));
}

function getFriendlyUploadErrorMessage(error) {
  if (
    error instanceof UploadHttpError ||
    (typeof error === 'object' &&
      error !== null &&
      'status' in error &&
      typeof error.status === 'number')
  ) {
    if (error.status >= 500) {
      return 'Upload service is temporarily unavailable. Please try again later.';
    }
    if (error.status >= 400) {
      return 'Upload failed. Please check your file and try again.';
    }
  }

  // Only treat the browser's explicit online state as offline
  if (
    typeof navigator !== 'undefined' &&
    typeof navigator.onLine === 'boolean' &&
    navigator.onLine === false
  ) {
    return 'Network error. Please check your connection and try again.';
  }

  if (isNetworkError(error)) {
    return 'Network error. Please check your connection and try again.';
  }

  return 'Upload failed. Please try again.';
}

module.exports = { UploadHttpError, getFriendlyUploadErrorMessage };
