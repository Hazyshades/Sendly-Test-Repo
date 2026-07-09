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

      // Generate previews for images
      const newPreviews = validFiles.map((file) => {
        if (file.type.startsWith('image/')) {
          return URL.createObjectURL(file);
        }
        return '';
      });
      setPreviews(newPreviews);

      if (onFilesSelected) {
        onFilesSelected(validFiles);
      }
    },
    [maxSizeMB, onFilesSelected]
  );

  const handleRemove = useCallback(() => {
    setSelectedFiles([]);
    setPreviews([]);
    setError(null);
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  }, []);

  useEffect(() => {
    // Cleanup preview URLs to avoid memory leaks
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
