export class UploadHttpError extends Error {
  readonly status: number;

  constructor(status: number) {
    super(`Upload failed with status ${status}`);
    this.name = 'UploadHttpError';
    this.status = status;
  }
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
