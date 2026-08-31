import React from "react";
import { useFileUpload } from "./lib/useFileUpload";

/**
 * Default maximum upload size in megabytes.
 * Callers may override this via the `maxSizeMB` prop.
 */
const DEFAULT_MAX_SIZE_MB = 5;

export interface IncorrectUploadProps {
  uploadUrl?: string;
  /** Maximum allowed file size in megabytes. Defaults to {@link DEFAULT_MAX_SIZE_MB} (5 MB). */
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
 * @param uploadUrl  POST endpoint. Falls back to runtime env vars when omitted.
 * @param maxSizeMB  Maximum file size in MB. Defaults to 5 MB.
 */
export const IncorrectUpload: React.FC<IncorrectUploadProps> = ({
  uploadUrl = getDefaultUploadUrl(),
  maxSizeMB = DEFAULT_MAX_SIZE_MB,
}) => {
  const {
    file,
    isUploading,
    message,
    error,
    inputRef,
    handleFileChange,
    handleUpload,
  } = useFileUpload({
    uploadUrl,
    maxSizeMB,
    clearOnSuccess: true,
    multiple: false,
    successMessage: "Upload successful.",
    emptySelectionMessage: "Please select a file before uploading.",
  });

  return (
    <div>
      <input ref={inputRef} type="file" onChange={handleFileChange} />
      <button type="button" onClick={handleUpload} disabled={!file || isUploading}>
        {isUploading ? "Uploading..." : "Upload"}
      </button>
      {message && <p role="status">{message}</p>}
      {error && <p role="alert">{error}</p>}
    </div>
  );
};
