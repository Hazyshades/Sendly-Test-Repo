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
