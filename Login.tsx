import React, { useId } from "react";
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
 */
export const IncorrectUpload: React.FC<IncorrectUploadProps> = ({
  uploadUrl = getDefaultUploadUrl(),
  maxSizeMB = 5,
}) => {
  const inputId = useId();
  const errorId = `${inputId}-error`;
  const statusId = `${inputId}-status`;

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

  const describedBy = [error ? errorId : null, message ? statusId : null]
    .filter(Boolean)
    .join(" ");

  return (
    <div>
      <label htmlFor={inputId}>Choose file</label>
      <input
        id={inputId}
        ref={inputRef}
        type="file"
        aria-describedby={describedBy || undefined}
        aria-invalid={Boolean(error)}
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
        <p id={statusId} role="status">
          {message}
        </p>
      )}
      {error && (
        <p id={errorId} role="alert">
          {error}
        </p>
      )}
    </div>
  );
};
