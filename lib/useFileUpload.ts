import { useCallback, useEffect, useRef, useState } from 'react';
import type { ChangeEvent, MutableRefObject, RefObject } from 'react';
import {
  UploadHttpError,
  getFriendlyUploadErrorMessage,
  isNetworkError,
} from './mapUploadError';

export { UploadHttpError, getFriendlyUploadErrorMessage, isNetworkError };

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
  inputRef: RefObject<HTMLInputElement>;
  uploadingRef: MutableRefObject<boolean>;
  uploadInFlightRef: MutableRefObject<boolean>;
  handleFileChange: (event: ChangeEvent<HTMLInputElement>) => void;
  handleUpload: () => Promise<void>;
  commitSelection: (files: File[]) => void;
  clearSelection: () => void;
  resetSelection: () => void;
}

/**
 * Decide whether a file matches an HTML accept filter.
 */
export function isAcceptedFile(file: File, accept?: string): boolean {
  if (!accept || accept.trim() === '') {
    return true;
  }

  const patterns = accept
    .split(',')
    .map((pattern) => pattern.trim().toLowerCase())
    .filter(Boolean);

  if (patterns.length === 0) {
    return true;
  }

  const name = file.name.toLowerCase();
  const type = file.type.toLowerCase();

  return patterns.some((pattern) => {
    if (pattern === '*/*') {
      return true;
    }
    if (pattern.startsWith('.')) {
      return name.endsWith(pattern);
    }
    if (pattern.endsWith('/*')) {
      return type.startsWith(`${pattern.slice(0, -1)}`);
    }
    return type === pattern;
  });
}

/**
 * Shared upload hook: selection, validation, previews, re-entry guards,
 * abort-on-unmount, and multipart upload with friendly error mapping.
 */
export function useFileUpload(options: UseFileUploadOptions = {}): UseFileUploadReturn {
  const {
    uploadUrl,
    accept,
    maxSizeMB = 5,
    multiple = false,
    clearOnSuccess = false,
    successMessage = 'Upload successful.',
    emptySelectionMessage = 'Please select a file before uploading.',
    onFilesSelected,
    onUploadSuccess,
    onUploadError,
  } = options;

  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [previews, setPreviews] = useState<string[]>([]);

  const inputRef = useRef<HTMLInputElement>(null);
  const uploadingRef = useRef(false);
  const uploadInFlightRef = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const previewsRef = useRef<string[]>([]);

  const file = selectedFiles[0] ?? null;

  useEffect(() => {
    previewsRef.current = previews;
  }, [previews]);

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
      previewsRef.current.forEach((url) => {
        if (url) {
          URL.revokeObjectURL(url);
        }
      });
      previewsRef.current = [];
    };
  }, []);

  const clearSelection = useCallback(() => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    uploadingRef.current = false;
    uploadInFlightRef.current = false;
    setSelectedFiles([]);
    setPreviews((prev) => {
      prev.forEach((url) => {
        if (url) {
          URL.revokeObjectURL(url);
        }
      });
      return [];
    });
    previewsRef.current = [];
    setMessage(null);
    setError(null);
    setIsUploading(false);
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  }, []);

  const resetSelection = useCallback(() => {
    clearSelection();
  }, [clearSelection]);

  const commitSelection = useCallback((files: File[]) => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    previewsRef.current.forEach((url) => {
      if (url) {
        URL.revokeObjectURL(url);
      }
    });
    previewsRef.current = [];
    setSelectedFiles(files);
    const newPreviews = files.map((file) => {
      if (file.type.startsWith('image/')) {
        return URL.createObjectURL(file);
      }
      return '';
    });
    previewsRef.current = newPreviews;
    setPreviews(newPreviews);
    setMessage(null);
    setError(null);
  }, []);

  const selectFiles = useCallback(
    (files: File[]) => {
      const maxBytes = maxSizeMB * 1024 * 1024;
      const validFiles: File[] = [];
      const invalidFileNames: string[] = [];

      for (const file of files) {
        if (!isAcceptedFile(file, accept)) {
          invalidFileNames.push(file.name);
          continue;
        }
        if (file.size > maxBytes) {
          invalidFileNames.push(file.name);
          continue;
        }

        validFiles.push(file);
      }

      setMessage(null);

      if (validFiles.length === 0) {
        clearSelection();
        setError(
          invalidFileNames.length > 0
            ? `File${invalidFileNames.length === 1 ? '' : 's'} "${invalidFileNames.join(', ')}" exceed${
                invalidFileNames.length === 1 ? 's' : ''
              } ${maxSizeMB}MB limit.`
            : emptySelectionMessage,
        );
        return;
      }

      previewsRef.current.forEach((url) => {
        if (url) {
          URL.revokeObjectURL(url);
        }
      });
      previewsRef.current = [];

      const newPreviews = validFiles.map((file) => {
        if (file.type.startsWith('image/')) {
          return URL.createObjectURL(file);
        }
        return '';
      });

      setSelectedFiles(validFiles);
      setError(
        invalidFileNames.length > 0
          ? `Skipped oversized or unaccepted file${invalidFileNames.length === 1 ? '' : 's'}: ${invalidFileNames.join(', ')}.`
          : null,
      );

      previewsRef.current = newPreviews;
      setPreviews(newPreviews);
      onFilesSelected?.(validFiles);
    },
    [accept, clearSelection, emptySelectionMessage, maxSizeMB, onFilesSelected],
  );

  const handleFileChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const rawFiles = Array.from(event.target.files ?? []);
      const files = multiple ? rawFiles : rawFiles.slice(0, 1);
      selectFiles(files);
    },
    [multiple, selectFiles],
  );

  const handleUpload = useCallback(async () => {
    if (selectedFiles.length === 0) {
      setMessage(null);
      setError(emptySelectionMessage);
      return;
    }

    if (uploadingRef.current) {
      return;
    }

    if (uploadInFlightRef.current) {
      return;
    }
    uploadingRef.current = true;

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
      if (!uploadUrl) {
        throw new Error('Upload URL is not configured.');
      }
      const endpoint = uploadUrl.trim();
      if (!endpoint) {
        throw new Error('Upload URL is not configured.');
      }

      const formData = new FormData();
      const fieldName = multiple ? 'files' : 'file';
      for (const file of selectedFiles) {
        formData.append(fieldName, file, file.name);
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        body: formData,
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        throw new UploadHttpError(response.status);
      }

      setMessage(successMessage);
      if (clearOnSuccess) {
        clearSelection();
      }
      onUploadSuccess?.();
    } catch (uploadError) {
      if (
        uploadError instanceof Error &&
        (uploadError.name === 'AbortError' || uploadError.name === 'CanceledError')
      ) {
        return;
      }
      const uploadErrorMessage = getFriendlyUploadErrorMessage(uploadError);
      setError(uploadErrorMessage);
      onUploadError?.(uploadErrorMessage);
      console.error('Upload error:', uploadError);
    } finally {
      uploadingRef.current = false;
      uploadInFlightRef.current = false;
      if (abortControllerRef.current === controller) {
        abortControllerRef.current = null;
      }
      setIsUploading(false);
    }
  }, [
    clearOnSuccess,
    clearSelection,
    emptySelectionMessage,
    multiple,
    onUploadError,
    onUploadSuccess,
    selectedFiles,
    successMessage,
    uploadUrl,
  ]);

  return {
    file,
    selectedFiles,
    previews,
    isUploading,
    message,
    error,
    inputRef,
    uploadingRef,
    uploadInFlightRef,
    handleFileChange,
    handleUpload,
    commitSelection,
    clearSelection,
    resetSelection,
  };
}
