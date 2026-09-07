export class UploadHttpError extends Error {
  readonly status: number;

  constructor(status: number) {
    super(`Upload failed with status ${status}`);
    this.name = 'UploadHttpError';
    this.status = status;
  }
}

/**
 * Determine whether an error object represents a network/connectivity failure.
 * Mirrors the heuristics in mapUploadError.cjs so the .ts and .cjs sources
 * stay in sync.
 */
export function isNetworkError(error: unknown): boolean {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    return true;
  }

  if (error && typeof error === 'object') {
    if (
      (error as { name?: string }).name === 'NetworkError' ||
      (error as { name?: string }).name === 'OfflineError'
    ) {
      return true;
    }
  }

  if (
    error instanceof Error ||
    (typeof error === 'object' && error !== null && typeof (error as { message?: unknown }).message === 'string')
  ) {
    const message = (error as { message: string }).message.toLowerCase();
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

  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return 'Network error. Please check your connection and try again.';
  }

  if (error instanceof TypeError && isNetworkError(error)) {
    return 'Network error. Please check your connection and try again.';
  }

  if (error instanceof Error && isNetworkError(error)) {
    return 'Network error. Please check your connection and try again.';
  }

  return 'Upload failed. Please try again.';
}
