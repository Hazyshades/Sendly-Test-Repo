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

  if (
    typeof navigator !== 'undefined' &&
    navigator !== null &&
    typeof navigator.onLine === 'boolean' &&
    !navigator.onLine
  ) {
    return 'Network error. Please check your connection and try again.';
  }

  if (error instanceof TypeError) {
    return 'Network error. Please check your connection and try again.';
  }

  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    if (
      message.includes('failed to fetch') ||
      message.includes('network') ||
      message.includes('fetch failed') ||
      message.includes('load failed') ||
      message.includes('offline')
    ) {
      return 'Network error. Please check your connection and try again.';
    }
  }

  return 'Upload failed. Please try again.';
}

module.exports = { UploadHttpError, getFriendlyUploadErrorMessage };
