import React from "react";
import { useFileUpload } from "./lib/useFileUpload";

export interface IncorrectUploadProps {
  uploadUrl?: string;
  maxSizeMB?: number;
}

type SendlyRuntime = typeof globalThis & {
  __SENDLY_CONFIG__?: { uploadUrl?: string };
  process?: { env?: { SENDLY_UPLOAD_URL?: string; REACT_APP_UPLOAD_URL?: string } };
};

const getDefaultUploadUrl = (): string => {
  const runtime = globalThis as SendlyRuntime;
  return (
    runtime.__SENDLY_CONFIG__?.uploadUrl ??
    runtime.process?.env?.SENDLY_UPLOAD_URL ??
    runtime.process?.env?.REACT_APP_UPLOAD_URL ??
    ""
  );
};

/**
 * Login screen upload UI.
 *
 * Upload I/O is delegated to `useFileUpload`, which owns AbortController
 * cancellation and isMountedRef guards so unmount mid-upload never calls setState.
 *
 * Accessibility:
 *  - `<label htmlFor="login-file-input">` is explicitly associated with the
 *    file input via a matching `id`.
 *  - An `aria-label` is also present as a fallback.
 *  - Status and error regions are referenced via `aria-describedby` so
 *    assistive technologies announce them after the input is described.
 */
export const IncorrectUpload: React.FC<IncorrectUploadProps> = ({
  uploadUrl = getDefaultUploadUrl(),
  maxSizeMB = 5,
}) => {
  const {
    file,
    isUploading,
    message,
    error,
    inputRef,
    handleFileChange,
    handleUpload,
    uploadingRef,
  } = useFileUpload({
    uploadUrl,
    maxSizeMB,
    clearOnSuccess: true,
    multiple: false,
    successMessage: "Upload successful.",
    emptySelectionMessage: "Please select a file before uploading.",
  });

  const describedBy = [
    error ? "login-file-error" : null,
    message ? "login-file-status" : null,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div>
      <label htmlFor="login-file-input">Choose file</label>
      <input
        id="login-file-input"
        ref={inputRef}
        type="file"
        aria-label="Choose file"
        aria-describedby={describedBy || undefined}
        onChange={handleFileChange}
      />
      <button
        type="button"
        onClick={handleUpload}
        disabled={!file || isUploading || uploadingRef.current}
        aria-busy={isUploading}
      >
        {isUploading ? "Uploading..." : "Upload"}
      </button>
      {message && (
        <p id="login-file-status" role="status">
          {message}
        </p>
      )}
      {error && (
        <p id="login-file-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
};
