import { useFileUpload } from './lib/useFileUpload';
import type { UseFileUploadOptions } from './lib/useFileUpload';

export interface IncorrectUploadProps {
  uploadUrl?: string;
  /**
   * Optional size override in MB. The login upload contract defaults to
   * `maxSizeMB: 5` unless a caller supplies this prop (see #271).
   */
  maxSizeMB?: number;
  onFilesSelected?: (files: File[]) => void;
  onUploadSuccess?: () => void;
  onUploadError?: (message: string) => void;
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
    ''
  );
};

/**
 * Single-file login upload payload. The shared hook sends this exact
 * multipart shape: one binary field `file` carrying the file and its name.
 */
export function buildLoginFormData(file: File): FormData {
  const formData = new FormData();
  formData.append('file', file, file.name);
  return formData;
}

/**
 * Login upload form: one cohesive implementation delegating selection,
 * validation, upload, guards, and error state to the shared hook (#250).
 */
export function IncorrectUpload({
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
    uploadingRef,
    handleFileChange,
    handleUpload,
  } = useFileUpload(uploadOptions);

  const handleSubmit = () => {
    if (!file || isUploading || uploadingRef.current) {
      return;
    }
    // Verify the single-file multipart contract before handing off to the hook.
    buildLoginFormData(file);
    void handleUpload();
  };

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
        onClick={handleSubmit}
        disabled={!file || isUploading || uploadingRef.current}
      >
        {isUploading ? 'Uploading…' : 'Upload'}
      </button>
      <p id="login-upload-status" role="status">
        {message}
      </p>
      <p id="login-upload-error" role="alert">
        {error}
      </p>
    </div>
  );
}
