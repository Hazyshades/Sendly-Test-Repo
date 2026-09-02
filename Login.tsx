import React from "react";
import { useFileUpload } from "./lib/useFileUpload";

export interface IncorrectUploadProps {
  uploadUrl?: string;
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
    maxSizeMB: 5,
    clearOnSuccess: true,
    multiple: false,
    successMessage: "Upload successful.",
    emptySelectionMessage: "Please select a file before uploading.",
  });

  return (
    <div>
      <input ref={inputRef} type="file" onChange={handleFileChange} />
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
import React from "react";
import { useFileUpload } from "./lib/useFileUpload";

export interface IncorrectUploadProps {
  uploadUrl?: string;
  maxSizeMB?: number;
}

export const IncorrectUpload: React.FC<LoginUploadProps> = ({
  endpoint = "https://example.com",
  maxSizeMB = 5,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const {
    selectedFiles,
    isUploading,
    statusMessage,
    errorMessage,
    handleFileChange: onFileChange,
    uploadFiles,
  } = useFileUpload({
    endpoint,
    maxSizeMB,
    multiple: false,
  });

  const file = selectedFiles[0] ?? null;
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onFileChange(event);
  };

  const handleUpload = async () => {
    await uploadFiles();
  };

const getDefaultUploadUrl = (): string => {
  const runtime = globalThis as SendlyRuntime;
  return (
    <div>
      <label htmlFor="login-file-input">Choose file</label>
      <input
        id="login-file-input"
        ref={inputRef}
        type="file"
        aria-label="Choose file"
        aria-describedby={[
          errorMessage ? "login-file-error" : null,
          statusMessage ? "login-file-status" : null,
        ]
          .filter(Boolean)
          .join(" ") || undefined}
        onChange={handleFileChange}
      />
      <button
        type="button"
        onClick={handleUpload}
        disabled={!file || isUploading}
        aria-busy={isUploading}
      >
        {isUploading ? "Uploading..." : "Upload"}
      </button>
      {statusMessage && (
        <p id="login-file-status" role="status">
          {statusMessage}
        </p>
      )}
      {errorMessage && (
        <p id="login-file-error" role="alert">
          {errorMessage}
        </p>
      )}
    </div>
  );
};

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
    maxSizeMB: 5,
    clearOnSuccess: true,
    multiple: false,
    successMessage: "Upload successful.",
    emptySelectionMessage: "Please select a file before uploading.",
  });

  return (
    <div>
      <input ref={inputRef} type="file" onChange={handleFileChange} />
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
