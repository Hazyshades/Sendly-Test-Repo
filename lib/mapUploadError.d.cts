/**
 * Error subclass carrying an HTTP status code for upload responses.
 */
export declare class UploadHttpError extends Error {
  readonly status: number;
  constructor(status: number);
}

/**
 * Evaluates whether an unknown error represents a network or offline failure.
 */
export declare function isNetworkError(error: unknown): boolean;

/**
 * Maps an upload error into a friendly, localized user-facing message.
 */
export declare function getFriendlyUploadErrorMessage(error: unknown): string;

declare module './mapUploadError.cjs' {
  export class UploadHttpError extends Error {
    readonly status: number;
    constructor(status: number);
  }

  export function isNetworkError(error: unknown): boolean;

  export function getFriendlyUploadErrorMessage(error: unknown): string;
}
