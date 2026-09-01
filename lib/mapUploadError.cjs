class UploadHttpError extends Error {
  constructor(status) {
    super(`Upload failed with status ${status}`);
    this.name = 'UploadHttpError';
    this.status = status;
  }
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

  if (error instanceof TypeError) {
    return 'Network error. Please check your connection and try again.';
  }

  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    // Narrow heuristics: only match explicit network/fetch failure patterns
    // Avoid broad substring checks that could match unrelated errors
    if (
      message === 'failed to fetch' ||
      message === 'fetch failed' ||
      message === 'load failed' ||
      message === 'networkerror when attempting to fetch resource.' ||
      message === 'client is offline' ||
      message.startsWith('network') ||
      message.includes('network error') ||
      message.includes('network request failed')
    ) {
      return 'Network error. Please check your connection and try again.';
    }
  }

  return 'Upload failed. Please try again.';
}

module.exports = { UploadHttpError, getFriendlyUploadErrorMessage };
