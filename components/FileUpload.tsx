import { useEffect, useMemo, useRef } from 'react';
import type { ChangeEvent } from 'react';
import { useFileUpload } from '../lib/useFileUpload';

export interface FileUploadProps {
  uploadUrl?: string;
  accept?: string;
  maxSizeMB?: number;
  multiple?: boolean;
  onFilesSelected?: (files: File[]) => void;
  onUploadSuccess?: () => void;
  onUploadError?: (message: string) => void;
}

/**
 * Thin file picker over the shared useFileUpload hook (see #252/#269):
 * the hook owns selection, upload, and error state; this component renders
 * the controls, previews, status lines, and a local re-entry guard.
 */
export function FileUpload({
  uploadUrl,
  accept,
  maxSizeMB,
  multiple = false,
  onFilesSelected,
  onUploadSuccess,
  onUploadError,
}: FileUploadProps) {
  const {
    isUploading,
    message,
    error,
    inputRef,
    uploadingRef,
    selectedFiles,
    handleUpload,
    commitSelection,
    clearSelection,
    resetSelection,
  } = useFileUpload({
    uploadUrl,
    accept,
    maxSizeMB,
    multiple,
    clearOnSuccess: true,
    successMessage: 'Upload successful.',
    emptySelectionMessage: 'Please select a file before uploading.',
    onFilesSelected,
    onUploadSuccess,
    onUploadError,
  });

  const previews = useMemo(
    () =>
      selectedFiles
        .filter((file) => file.type.startsWith('image/'))
        .map((file) => URL.createObjectURL(file)),
    [selectedFiles],
  );

  useEffect(() => {
    return () => {
      previews.forEach((url) => {
        URL.revokeObjectURL(url);
      });
    };
  }, [previews]);

  // Synchronous re-entry guard for this component's submit path.
  const uploadInFlightRef = useRef(false);

  const submitUpload = async () => {
    if (uploadInFlightRef.current) {
      return;
    }
    uploadInFlightRef.current = true;
    try {
      await handleUpload();
    } finally {
      uploadInFlightRef.current = false;
    }
  };

  const handleFilesChanged = (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files ? Array.from(event.target.files) : [];
    const validFiles: File[] = [];
    const invalidFileNames: string[] = [];
    const maxBytes = maxSizeMB !== undefined ? maxSizeMB * 1024 * 1024 : null;

    for (const file of files) {
      if (maxBytes !== null && file.size > maxBytes) {
        invalidFileNames.push(file.name);
        continue;
      }
      validFiles.push(file);
    }

    if (validFiles.length === 0) {
      clearSelection();
      onFilesSelected?.(validFiles);
      return;
    }

    commitSelection(validFiles);
    onFilesSelected?.(validFiles);
  };

  return (
    <div>
      <label htmlFor="file-upload-input">Select {multiple ? 'files' : 'a file'}</label>
      <input
        id="file-upload-input"
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        aria-describedby={error ? 'file-upload-error' : message ? 'file-upload-status' : undefined}
        aria-invalid={Boolean(error)}
        onChange={handleFileChange}
      />
      {error && (
        <p id="file-upload-error" role="alert" style={{ color: 'red' }}>
          {error}
        </p>
      )}
      {message && (
        <p id="file-upload-status" role="status">
          {message}
        </p>
      )}
      {selectedFiles.map((file, index) => (
        <div key={`${file.name}-${file.lastModified}-${index}`}>
          {previews[index] && (
            <img
              src={previews[index]}
              alt={`Preview of ${file.name}`}
              style={{ width: 100, height: 100, objectFit: 'cover' }}
            />
          )}
          <span>{file.name}</span>
        </div>
      ))}
      {selectedFiles.length > 0 && (
        <>
          <button
            type="button"
            onClick={handleRemove}
            disabled={isUploading || uploadingRef.current}
          >
            {multiple ? 'Remove all' : 'Remove'}
          </button>
          {uploadUrl && (
            <button
              type="button"
              onClick={handleUpload}
              disabled={isUploading || uploadingRef.current}
              aria-busy={isUploading}
            >
              {isUploading ? 'Uploading...' : 'Upload'}
            </button>
          )}
        </>
      )}
    </div>
  );
};

// disabled={isUploading}
