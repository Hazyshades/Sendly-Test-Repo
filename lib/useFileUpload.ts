import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  UploadHttpError,
  getFriendlyUploadErrorMessage,
} from './mapUploadError.cjs';

export { UploadHttpError, getFriendlyUploadErrorMessage };

export interface UseFileUploadOptions {
  uploadUrl?: string;
  accept?: string;
  maxSizeMB?: number;
  multiple?: boolean;
  clearOnSuccess?: boolean;
  successMessage?: string;
  emptySelectionMessage?: string;
  onFilesSelected?: (files: File[]) => void;
  onUploadSuccess?: () => void;
  onUploadError?: (message: string) => void;
}

export interface UseFileUploadReturn {
  file: File | null;
  selectedFiles: File[];
  previews: string[];
  isUploading: boolean;
  message: string | null;
  error: string | null;
  inputRef: React.RefObject<HTMLInputElement>;
  handleFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  handleUpload: () => Promise<void>;
  handleRemove: () => void;
  uploadingRef: React.MutableRefObject<boolean>;
  resetSelection: () => void;
}

const isAcceptedFile = (file: File, accept?: string): boolean => {
  if (!accept?.trim()) {
    return true;
  }

  const fileName = file.name.toLowerCase();
  const fileType = file.type.toLowerCase();

  return accept.split(',').some((rawToken) => {
    const token = rawToken.trim().toLowerCase();

    if (token.startsWith('.')) {
      return fileName.endsWith(token);
    }

    if (token.endsWith('/*')) {
      return fileType.startsWith(token.slice(0, -1));
    }

    return fileType === token;
  });
};

export function useFileUpload({
  uploadUrl,
  accept,
  maxSizeMB = 5,
  multiple = false,
  clearOnSuccess = false,
  successMessage = 'Upload successful!',
  emptySelectionMessage = 'Please select a file before uploading.',
  onFilesSelected,
  onUploadSuccess,
  onUploadError,
}: UseFileUploadOptions = {}): UseFileUploadReturn {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const uploadingRef = useRef(false);
  const previewsRef = useRef<string[]>([]);
  const abortControllerRef = useRef<AbortController | null>(null);
  const isMountedRef = useRef(true);

  const replacePreviews = useCallback((nextPreviews: string[]) => {
    previewsRef.current.forEach((url) => {
      if (url) {
        URL.revokeObjectURL(url);
      }
    });
    previewsRef.current = nextPreviews;
    setPreviews(nextPreviews);
  }, []);

  const resetSelection = useCallback(() => {
    setSelectedFiles([]);
    replacePreviews([]);
    if (inputRef.current) {
      inputRef.current.value = '';
    }
    onFilesSelected?.([]);
  }, [onFilesSelected, replacePreviews]);

  const selectFiles = useCallback(
    (candidates: File[]) => {
      const maxBytes = maxSizeMB !== undefined ? maxSizeMB * 1024 * 1024 : null;
      const validFiles: File[] = [];
      const errors: string[] = [];

      for (const file of candidates) {
        if (maxBytes !== null && file.size > maxBytes) {
          errors.push(`${file.name} exceeds the ${maxSizeMB}MB limit.`);
          continue;
        }

        if (!isAcceptedFile(file, accept)) {
          errors.push(`${file.name} is not an accepted file type.`);
          continue;
        }

        validFiles.push(file);
      }

      setMessage(null);

      if (validFiles.length === 0) {
        resetSelection();
        setError(errors[0] ?? 'No valid files selected.');
        return;
      }

      const nextPreviews = validFiles.map((file) =>
        file.type.startsWith('image/') ? URL.createObjectURL(file) : '',
      );

      setSelectedFiles(validFiles);
      replacePreviews(nextPreviews);
      setError(errors.length > 0 ? errors.join(' ') : null);
      onFilesSelected?.(validFiles);
    },
    [accept, maxSizeMB, onFilesSelected, replacePreviews, resetSelection],
  );

  const handleFileChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const candidates = Array.from(event.target.files ?? []);
      selectFiles(multiple ? candidates : candidates.slice(0, 1));
    },
    [multiple, selectFiles],
  );

  const handleUpload = useCallback(async () => {
    if (selectedFiles.length === 0) {
      setError(emptySelectionMessage);
      return;
    }

    if (!uploadUrl) {
      setError('Upload URL is not configured.');
      return;
    }

    if (uploadingRef.current) {
      return;
    }
    uploadingRef.current = true;
    setIsUploading(true);
    setMessage(null);
    setError(null);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const formData = new FormData();
      const fieldName = multiple ? 'files' : 'file';

      for (const file of selectedFiles) {
        formData.append(fieldName, file, file.name);
      }

      const response = await fetch(uploadUrl, {
        method: 'POST',
        body: formData,
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new UploadHttpError(response.status);
      }

      if (isMountedRef.current) {
        setMessage(successMessage);
        if (clearOnSuccess) {
          resetSelection();
        }
        onUploadSuccess?.();
      }
    } catch (uploadError) {
      if (uploadError instanceof Error && uploadError.name === 'AbortError') {
        return;
      }

      const uploadErrorMessage = getFriendlyUploadErrorMessage(uploadError);
      if (isMountedRef.current) {
        setError(uploadErrorMessage);
        onUploadError?.(uploadErrorMessage);
      }
    } finally {
      abortControllerRef.current = null;
      uploadingRef.current = false;
      if (isMountedRef.current) {
        setIsUploading(false);
      }
    }
  }, [
    clearOnSuccess,
    emptySelectionMessage,
    multiple,
    onUploadError,
    onUploadSuccess,
    resetSelection,
    selectedFiles,
    successMessage,
    uploadUrl,
  ]);

  const handleRemove = useCallback(() => {
    resetSelection();
    setError(null);
    setMessage(null);
  }, [resetSelection]);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      uploadingRef.current = false;
      abortControllerRef.current?.abort();
      previewsRef.current.forEach((url) => {
        if (url) {
          URL.revokeObjectURL(url);
        }
      });
    };
  }, []);

  return {
    file: selectedFiles[0] ?? null,
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
    resetSelection,
  };
}
