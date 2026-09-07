/**
 * Error subclass carrying an HTTP status code for upload responses.
 */
class UploadHttpError extends Error {
  constructor(status) {
    super(`Upload failed with status ${status}`);
    this.name = 'UploadHttpError';
    this.status = status;
  }
}

/**
 * Evaluates whether an unknown error represents a network or offline failure.
 *
 * @param error - The error or rejection value to inspect.
 * @returns True if the error matches offline or network failure patterns.
 */
function isNetworkError(error) {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    return true;
  }

  if (error && typeof error === 'object') {
    if (error.name === 'NetworkError' || error.name === 'OfflineError') {
      return true;
    }
  }

  if (
    error instanceof Error ||
    (typeof error === 'object' && error !== null && typeof error.message === 'string')
  ) {
    const message = error.message.toLowerCase();
    const networkPatterns = [
      'failed to fetch',
      'fetch failed',
      'load failed',
      'networkerror',
      'network error',
      'network request failed',
      'network failure',
      'client is offline',
      'net::err_',
      'econnrefused',
      'enetunreach',
      'etimedout',
    ];

    if (networkPatterns.some((pattern) => message.includes(pattern))) {
      return true;
    }

    if (/\boffline\b/.test(message)) {
      return true;
    }
  }

  return false;
}

/**
 * Maps an upload error into a friendly, localized user-facing message.
 *
 * @param error - The upload error to map.
 * @returns The friendly error message string.
 */
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

  if (isNetworkError(error)) {
    return 'Network error. Please check your connection and try again.';
  }

  return 'Upload failed. Please try again.';
}

module.exports = { UploadHttpError, getFriendlyUploadErrorMessage, isNetworkError };
