import React from "react";
import { useFileUpload } from "./lib/useFileUpload";

export interface IncorrectUploadProps {
  uploadUrl?: string;
  /**
   * Maximum allowed file size in megabytes.
   * Defaults to 5 MB.
   */
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
  onFilesSelected,
  onUploadSuccess,
  onUploadError,
}: IncorrectUploadProps) {
  const uploadOptions: UseFileUploadOptions = {
    uploadUrl,
    maxSizeMB,
    multiple: false,
    clearOnSuccess: true,
    successMessage: 'Upload successful.',
    emptySelectionMessage: 'Please select a file before uploading.',
    onFilesSelected,
    onUploadSuccess,
    onUploadError,
  };

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

  return (
    <div>
      <label htmlFor="login-file-input">Upload file</label>
      <input
        id="login-file-input"
        ref={inputRef}
        type="file"
        onChange={handleFileChange}
        disabled={!file || isUploading}
        aria-describedby="login-upload-status login-upload-error"
      />
      <button
        type="button"
        onClick={handleUpload}
        disabled={!file || isUploading || uploadingRef.current}
      >
        {isUploading ? "Uploading..." : "Upload"}
      </button>
      {message && <p role="status">{message}</p>}
      {error && <p role="alert">{error}</p>}
    </div>
  );
};
