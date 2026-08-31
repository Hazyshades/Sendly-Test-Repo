import React, { useCallback, useEffect, useRef, useState } from 'react';
import { UploadHttpError, getFriendlyUploadErrorMessage } from './mapUploadError.cjs';

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

export interface UseFileUploadResult {
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
}

const isAcceptedFile = (file: File, accept?: string) => {
  if (!accept || accept.trim() === '') {
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

export const useFileUpload = ({
  uploadUrl,
  accept,
  maxSizeMB,
  multiple = false,
  clearOnSuccess = false,
  successMessage = 'Upload successful!',
  emptySelectionMessage = 'Please select a file before uploading.',
  onFilesSelected,
  onUploadSuccess,
  onUploadError,
}: UseFileUploadOptions): UseFileUploadResult => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const uploadInFlightRef = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const isMountedRef = useRef(true);
  const previewsRef = useRef<string[]>([]);

  // Revoke all existing preview object URLs, then set the new list.
  // Defined before clearSelection so clearSelection can safely call it.
  const replacePreviews = useCallback((nextPreviews: string[]) => {
    previewsRef.current.forEach((url) => {
      if (url) {
        URL.revokeObjectURL(url);
      }
    });
    previewsRef.current = nextPreviews;
    setPreviews(nextPreviews);
  }, []);

  // Single clearSelection implementation — resets file list, revokes preview
  // URLs, and clears the native input value so the same file can be re-selected.
  const clearSelection = useCallback(() => {
    replacePreviews([]);
    setSelectedFiles([]);
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  }, [replacePreviews]);

  const selectFiles = useCallback(
    (files: File[]) => {
      const validFiles: File[] = [];
      const invalidFileNames: string[] = [];
      const candidates = multiple ? files : files.slice(0, 1);
      const maxBytes =
        maxSizeMB !== undefined && Number.isFinite(maxSizeMB) && maxSizeMB > 0
          ? maxSizeMB * 1024 * 1024
          : null;

      if (!multiple && files.length > 1) {
        invalidFileNames.push('(only one file can be selected at a time)');
      }

      for (const file of candidates) {
        if (maxBytes !== null && file.size > maxBytes) {
          invalidFileNames.push(file.name);
          continue;
        }

        if (!isAcceptedFile(file, accept)) {
          invalidFileNames.push(file.name);
          continue;
        }

        validFiles.push(file);
      }

      setMessage(null);

      if (validFiles.length === 0) {
        setError(
          invalidFileNames.length > 0
            ? `File(s) not accepted: ${invalidFileNames.join(', ')}`
            : 'No valid files selected.',
        );
        clearSelection();
        return;
      }

      const nextPreviews = validFiles.map((file) =>
        file.type.startsWith('image/') ? URL.createObjectURL(file) : '',
      );

      setError(
        invalidFileNames.length > 0
          ? `Some files were skipped: ${invalidFileNames.join(', ')}`
          : null,
      );
      setSelectedFiles(validFiles);
      replacePreviews(nextPreviews);
      onFilesSelected?.(validFiles);
    },
    [accept, maxSizeMB, multiple, onFilesSelected, replacePreviews, clearSelection],
  );

  const handleFileChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      selectFiles(Array.from(event.target.files ?? []));
    },
    [selectFiles],
  );

  const handleUpload = useCallback(async () => {
    if (!uploadUrl) {
      setError('Upload URL is not configured.');
      return;
    }

    if (selectedFiles.length === 0) {
      setError(emptySelectionMessage);
      return;
    }

    if (uploadInFlightRef.current) {
      return;
    }

    uploadInFlightRef.current = true;
    const controller = new AbortController();
    abortControllerRef.current = controller;

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
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new UploadHttpError(response.status);
      }

      if (isMountedRef.current) {
        setMessage(successMessage);
        if (clearOnSuccess) {
          clearSelection();
        }
        onUploadSuccess?.();
      }
    } catch (uploadError) {
      if (uploadError instanceof Error && uploadError.name === 'AbortError') {
        return;
      }

      if (!isMountedRef.current) {
        return;
      }

      const uploadErrorMessage = getFriendlyUploadErrorMessage(uploadError);
      setError(uploadErrorMessage);
      onUploadError?.(uploadErrorMessage);
      console.error('Upload error:', uploadError);
    } finally {
      if (abortControllerRef.current === controller) {
        abortControllerRef.current = null;
        uploadInFlightRef.current = false;
        if (isMountedRef.current) {
          setIsUploading(false);
        }
      }
    }
  }, [
    clearOnSuccess,
    emptySelectionMessage,
    multiple,
    onUploadError,
    onUploadSuccess,
    clearSelection,
    selectedFiles,
    successMessage,
    uploadUrl,
  ]);

  const handleRemove = useCallback(() => {
    clearSelection();
    setError(null);
    setMessage(null);
  }, [clearSelection]);

  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
      uploadInFlightRef.current = false;
      abortControllerRef.current?.abort();
      abortControllerRef.current = null;
      previewsRef.current.forEach((url) => {
        if (url) {
          URL.revokeObjectURL(url);
        }
      });
      previewsRef.current = [];
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
  };
};
