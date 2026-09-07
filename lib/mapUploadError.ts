/**
 * Error subclass carrying an HTTP status code for upload responses.
 */
export class UploadHttpError extends Error {
  readonly status: number;

  constructor(status: number) {
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
export function isNetworkError(error: unknown): boolean {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    return true;
  }

  if (error && typeof error === 'object') {
    const errorObj = error as { name?: unknown };
    if (errorObj.name === 'NetworkError' || errorObj.name === 'OfflineError') {
      return true;
    }
  }

  if (
    error instanceof Error ||
    (typeof error === 'object' &&
      error !== null &&
      'message' in error &&
      typeof (error as { message: unknown }).message === 'string')
  ) {
    const message = (error as Error).message.toLowerCase();
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
export function getFriendlyUploadErrorMessage(error: unknown): string {
  if (
    error instanceof UploadHttpError ||
    (typeof error === 'object' &&
      error !== null &&
      'status' in error &&
      typeof (error as { status: unknown }).status === 'number')
  ) {
    const status = (error as { status: number }).status;
    if (status >= 500) {
      return 'Upload service is temporarily unavailable. Please try again later.';
    }
    if (status >= 400) {
      return 'Upload failed. Please check your file and try again.';
    }
  }

  if (isNetworkError(error)) {
    return 'Network error. Please check your connection and try again.';
  }

  return 'Upload failed. Please try again.';
}