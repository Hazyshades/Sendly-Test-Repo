import React from 'react';
import { useFileUpload } from '../lib/useFileUpload';

const inputId = 'file-upload-input';
const errorId = 'file-upload-error';
const statusId = 'file-upload-status';

export interface FileUploadProps {
  accept?: string;
  maxSizeMB?: number;
  multiple?: boolean;
  uploadUrl?: string;
  onFilesSelected?: (files: File[]) => void;
  onUploadSuccess?: () => void;
  onUploadError?: (message: string) => void;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  accept = 'image/*,.pdf,.doc,.docx',
  maxSizeMB = 5,
  multiple = false,
  uploadUrl,
  onFilesSelected,
  onUploadSuccess,
  onUploadError,
}) => {
  const {
    selectedFiles,
    previews,
    isUploading,
    message,
    error,
    inputRef,
    handleFileChange,
    handleUpload,
    handleRemove,
    uploadingRef,
  } = useFileUpload({
    accept,
    maxSizeMB,
    multiple,
    uploadUrl,
    onFilesSelected,
    onUploadSuccess,
    onUploadError,
  });

  const describedBy = [error ? errorId : null, message ? statusId : null]
    .filter(Boolean)
    .join(' ');

  return (
    <div>
      <label htmlFor="file-upload-input">Select {multiple ? 'files' : 'a file'}</label>
      <input
        id={inputId}
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        aria-describedby={describedBy || undefined}
        aria-invalid={Boolean(error)}
        onChange={handleFileChange}
      />

      {error ? (
        <p id="file-upload-error" role="alert" style={{ color: 'red' }}>
          {error}
        </p>
      ) : null}

      {message ? (
        <p id="file-upload-status" role="status">
          {message}
        </p>
      ) : null}

      {selectedFiles.map((file, index) => (
        <div key={`${file.name}-${file.lastModified}-${index}`}>
          {previews[index] ? (
            <img
              src={previews[index]}
              alt={`Preview of ${file.name}`}
              style={{ width: 100, height: 100, objectFit: 'cover' }}
            />
          ) : null}
          <span>{file.name}</span>
        </div>
      ))}

      {selectedFiles.length > 0 ? (
        <div>
          <button
            type="button"
            onClick={handleRemove}
            disabled={isUploading || uploadingRef.current}
          >
            {multiple ? 'Remove all' : 'Remove'}
          </button>
          {uploadUrl ? (
            <button
              type="button"
              onClick={handleUpload}
              disabled={isUploading || uploadingRef.current}
              aria-busy={isUploading}
            >
              {isUploading ? 'Uploading...' : 'Upload'}
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
};
