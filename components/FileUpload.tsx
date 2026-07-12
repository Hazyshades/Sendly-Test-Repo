import React, { useState, useCallback, useRef, useEffect } from 'react';

export interface FileUploadProps {
  accept?: string;
  maxSizeMB?: number;
  multiple?: boolean;
  onFilesSelected?: (files: File[]) => void;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  accept = 'image/*,.pdf,.doc,.docx',
  maxSizeMB = 5,
  multiple = false,
  onFilesSelected,
}) => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const clearSelection = useCallback(() => {
    setSelectedFiles([]);
    setPreviews([]);
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  }, []);

  const handleFileChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(event.target.files || []);
      const maxBytes = maxSizeMB * 1024 * 1024;
      const validFiles: File[] = [];
      const invalidFileNames: string[] = [];

      for (const file of files) {
        if (file.size > maxBytes) {
          invalidFileNames.push(file.name);
        } else {
          validFiles.push(file);
        }
      }

      if (files.length === 0 || validFiles.length === 0) {
        setError(
          invalidFileNames.length > 0
            ? `File${invalidFileNames.length > 1 ? 's' : ''} "${invalidFileNames.join(', ')}" exceed${
                invalidFileNames.length > 1 ? '' : 's'
              } ${maxSizeMB}MB limit.`
            : 'No valid files selected.'
        );
        clearSelection();
        return;
      }

      setError(
        invalidFileNames.length > 0
          ? `Skipped file${invalidFileNames.length > 1 ? 's' : ''} "${invalidFileNames.join(', ')}" because ${
              invalidFileNames.length > 1 ? 'they exceed' : 'it exceeds'
            } the ${maxSizeMB}MB limit.`
          : null
      );
      } else {
        setError(null);
      }

      if (validFiles.length === 0) {
        if (invalidFileNames.length === 0) {
          setError('No valid files selected.');
        }
        setSelectedFiles([]);
        setPreviews([]);
        // Reset the input so the same (invalid) file can be re-selected after fixing it.
        if (inputRef.current) {
          inputRef.current.value = '';
        }
        return;
      }

      setSelectedFiles(validFiles);

      const newPreviews = validFiles.map((file) => (file.type.startsWith('image/') ? URL.createObjectURL(file) : ''));
      setPreviews(newPreviews);

      onFilesSelected?.(validFiles);
    },
    [clearSelection, maxSizeMB, onFilesSelected]
  );

  const handleRemove = useCallback(() => {
    setError(null);
    clearSelection();
  }, [clearSelection]);

  useEffect(() => {
    return () => {
      previews.forEach((url) => {
        if (url) {
          URL.revokeObjectURL(url);
        }
      });
    };
  }, [previews]);

  return (
    <div>
      <input ref={inputRef} type="file" accept={accept} multiple={multiple} onChange={handleFileChange} />
      {error && <p role="alert" style={{ color: 'red' }}>{error}</p>}
      {previews.map((url, idx) =>
        url ? <img key={idx} src={url} alt="preview" style={{ width: 100, height: 100, objectFit: 'cover' }} /> : null
      )}
      {selectedFiles.length > 0 && <button onClick={handleRemove}>Remove</button>}
    </div>
  );
};
import React, { useState, useCallback, useRef, useEffect } from 'react';

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
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(event.target.files || []);
      const validFiles: File[] = [];
      const errors: string[] = [];

      for (const file of files) {
        if (file.size > maxSizeMB * 1024 * 1024) {
          errors.push(`File "${file.name}" exceeds ${maxSizeMB}MB limit.`);
          continue;
        }
        validFiles.push(file);
      }

      setMessage(null);

      if (validFiles.length === 0) {
        setError(errors.length > 0 ? errors.join(' ') : 'No valid files selected.');
        setSelectedFiles([]);
        setPreviews([]);
        if (inputRef.current) {
          inputRef.current.value = '';
        }
        return;
      }

      setError(errors.length > 0 ? errors.join(' ') : null);
      setSelectedFiles(validFiles);

      const newPreviews = validFiles.map((file) => {
        if (file.type.startsWith('image/')) {
          return URL.createObjectURL(file);
        }
        return '';
      });
      setPreviews(newPreviews);

      onFilesSelected?.(validFiles);
    },
    [maxSizeMB, onFilesSelected],
  );

  const handleUpload = useCallback(async () => {
    if (!uploadUrl) {
      setError('Upload URL is not configured.');
      return;
    }

    if (selectedFiles.length === 0) {
      setError('Please select a file before uploading.');
      return;
    }

    setIsUploading(true);
    setMessage(null);
    setError(null);

    try {
      const formData = new FormData();
      const fieldName = multiple ? 'files' : 'file';

      for (const file of selectedFiles) {
        formData.append(fieldName, file, file.name);
      }

      const response = await fetch(uploadUrl, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Upload failed with status ${response.status}`);
      }

      setMessage('Upload successful!');
      onUploadSuccess?.();
    } catch (err) {
      const uploadError = err instanceof Error ? err.message : 'Upload failed.';
      setError(uploadError);
      onUploadError?.(uploadError);
      console.error('Upload error:', err);
    } finally {
      setIsUploading(false);
    }
  }, [multiple, onUploadError, onUploadSuccess, selectedFiles, uploadUrl]);

  const handleRemove = useCallback(() => {
    setSelectedFiles([]);
    setPreviews([]);
    setError(null);
    setMessage(null);
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  }, []);

  useEffect(() => {
    return () => {
      previews.forEach((url) => {
        if (url) {
          URL.revokeObjectURL(url);
        }
      });
    };
  }, [previews]);

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={handleFileChange}
      />
      {error && (
        <p role="alert" style={{ color: 'red' }}>
          {error}
        </p>
      )}
      {message && <p role="status">{message}</p>}
      {previews.map((url, idx) =>
        url ? (
          <img
            key={idx}
            src={url}
            alt="preview"
            style={{ width: 100, height: 100, objectFit: 'cover' }}
          />
        ) : null,
      )}
      {selectedFiles.length > 0 && (
        <>
          <button type="button" onClick={handleRemove} disabled={isUploading}>
            Remove
          </button>
          {uploadUrl && (
            <button type="button" onClick={handleUpload} disabled={isUploading}>
              {isUploading ? 'Uploading...' : 'Upload'}
            </button>
          )}
        </>
      )}
    </div>
  );
};
