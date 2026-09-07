import { useEffect, useMemo } from 'react';
import { useFileUpload } from '../lib/useFileUpload';

/**
 * Props for the FileUpload component.
 */
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
 * File upload user interface component delegating selection and upload logic to useFileUpload.
 *
 * @param props Configuration options and event callbacks for file upload.
 * @returns JSX Element rendering the accessible file upload form and preview list.
 */
export function FileUpload({
  uploadUrl,
  accept,
  maxSizeMB = 5,
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
    handleFileChange,
    handleUpload,
    clearSelection,
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

  const previews = useMemo(() => {
    const previewMap = new Map<File, string>();
    selectedFiles.forEach((file) => {
      if (file.type.startsWith('image/')) {
        previewMap.set(file, URL.createObjectURL(file));
      }
    });
    return previewMap;
  }, [selectedFiles]);

  useEffect(() => {
    return () => {
      Object.values(previews).forEach((url) => {
        if (url) URL.revokeObjectURL(url);
      });
    };
  }, [previews]);

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
      {selectedFiles.map((file, index) => {
        const previewUrl = previews.get(file);
        return (
          <div key={`${file.name}-${file.lastModified}-${index}`}>
            {previewUrl && (
              <img
                src={previewUrl}
                alt={`Preview of ${file.name}`}
                style={{ width: 100, height: 100, objectFit: 'cover' }}
              />
            )}
            <span>{file.name}</span>
          </div>
        );
      })}
      {selectedFiles.length > 0 && (
        <>
          <button
            type="button"
            onClick={clearSelection}
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
}
