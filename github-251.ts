import { useState, useCallback, useRef } from 'react';

// Utility function to check if a file is accepted based on allowed types and size
function isAcceptedFile(file: File, acceptedTypes: string[], maxSize: number): boolean {
  if (file.size > maxSize) {
    return false;
  }

  if (acceptedTypes.length === 0) {
    return true;
  }

  const fileType = file.type;
  return acceptedTypes.some((type) => {
    if (type.startsWith('.')) {
      const fileExtension = `.${file.name.split('.').pop()?.toLowerCase()}`;
      return type.toLowerCase() === fileExtension;
    } else if (type.includes('/')) {
      return fileType === type || fileType.startsWith(type.split('/')[0]);
    }
    return false;
  });
}

interface UseFileUploadProps {
  acceptedTypes?: string[];
  maxSize?: number;
  multiple?: boolean;
  onChange?: (files: File[]) => void;
}

export const useFileUpload = ({
  acceptedTypes = [],
  maxSize = 10 * 1024 * 1024, // 10MB default
  multiple = false,
  onChange,
}: UseFileUploadProps = {}) => {
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback(
    (selectedFiles: FileList | null) => {
      if (!selectedFiles) return;

      const newFiles = Array.from(selectedFiles);
      const validFiles: File[] = [];
      let errorMessage: string | null = null;

      for (const file of newFiles) {
        if (isAcceptedFile(file, acceptedTypes, maxSize)) {
          validFiles.push(file);
        } else {
          errorMessage = `File "${file.name}" is not accepted`;
        }
      }

      if (errorMessage && !multiple && validFiles.length === 0) {
        setError(errorMessage);
        return;
      }

      const updatedFiles = multiple ? [...files, ...validFiles] : validFiles;
      setFiles(updatedFiles);
      setError(errorMessage);
      onChange?.(updatedFiles);
    },
    [acceptedTypes, maxSize, multiple, files, onChange]
  );

  const handleChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      handleFiles(event.target.files);
      // Reset input value to allow selecting the same file again
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    },
    [handleFiles]
  );

  const handleDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      event.stopPropagation();
      handleFiles(event.dataTransfer.files);
    },
    [handleFiles]
  );

  const handleDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
  }, []);

  const removeFile = useCallback(
    (index: number) => {
      setFiles((prevFiles) => prevFiles.filter((_, i) => i !== index));
      onChange?.(files.filter((_, i) => i !== index));
    },
    [files, onChange]
  );

  const clearFiles = useCallback(() => {
    setFiles([]);
    onChange?.([]);
  }, [onChange]);

  const triggerFileInput = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  return {
    files,
    error,
    fileInputRef,
    handleChange,
    handleDrop,
    handleDragOver,
    removeFile,
    clearFiles,
    triggerFileInput,
  };
};