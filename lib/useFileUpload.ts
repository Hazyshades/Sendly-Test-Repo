import { useCallback, useEffect, useRef, useState } from 'react';
import type { ChangeEvent, MutableRefObject, RefObject } from 'react';
import { getFriendlyUploadErrorMessage, UploadHttpError } from './mapUploadError';

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
 * Decide whether a file matches the accept filter.
 * Top-level helper so the rule lives in one place (see #251).
 */
function isAcceptedFile(file: File, accept?: string): boolean {
  if (!accept) {
    return true;
  }
  const patterns = accept
    .split(',')
    .map((pattern) => pattern.trim().toLowerCase())
    .filter((pattern) => pattern.length > 0);
  if (patterns.length === 0) {
    return true;
  }
  const name = file.name.toLowerCase();
  const type = file.type.toLowerCase();
  return patterns.some((pattern) => {
    if (pattern.startsWith('.')) {
      return name.endsWith(pattern);
    }
    if (pattern.endsWith('/*')) {
      return type.startsWith(pattern.replace('/*', '/'));
    }
    if (type.startsWith(`${pattern}/`) || pattern.startsWith(`${type.split('/')[0]}`)) {
      return true;
    }
    return type === pattern;
  });
}

/**
 * Create object URLs for image previews (owned by the hook, see #276).
 */
function makePreviews(files: File[]): string[] {
  const urls: string[] = [];
  for (const file of files) {
    if (file.type.startsWith('image/')) {
      urls.push(URL.createObjectURL(file));
    }
  }
  return urls;
}

/**
 * Shared upload hook: selection, validation, previews, re-entry guards,
 * abort-on-unmount, and multipart upload with friendly error mapping.
 */
export function useFileUpload(options: UseFileUploadOptions = {}): UseFileUploadReturn {
  const {
    uploadUrl,
    accept,
    maxSizeMB,
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

  useEffect(() => {
    previewsRef.current = previews;
  }, [previews]);

  // Abort any in-flight request and revoke preview URLs on unmount.
  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
      previewsRef.current.forEach((url) => {
        URL.revokeObjectURL(url);
      });
    };
  }, []);

  const clearSelection = useCallback(() => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    uploadingRef.current = false;
    uploadInFlightRef.current = false;
    setSelectedFiles([]);
    setPreviews([]);
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
    setSelectedFiles(files);
    setPreviews(makePreviews(files));
    setMessage(null);
    setError(null);
  }, []);

  const handleFileChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const rawFiles = event.target.files ? Array.from(event.target.files) : [];
      const candidates = multiple ? rawFiles : rawFiles.slice(0, 1);

      const validFiles: File[] = [];
      const errors: string[] = [];
      const maxBytes = maxSizeMB !== undefined ? maxSizeMB * 1024 * 1024 : null;

      for (const file of candidates) {
        if (!isAcceptedFile(file, accept)) {
          errors.push(`${file.name} is not an accepted file type.`);
          continue;
        }
        if (maxBytes !== null && file.size > maxBytes) {
          errors.push(`${file.name} exceeds ${maxSizeMB} MB.`);
          continue;
        }
        validFiles.push(file);
      }

      if (validFiles.length === 0) {
        resetSelection();
        setError(errors.length > 0 ? errors.join(' ') : emptySelectionMessage);
        return;
      }

      setSelectedFiles(validFiles);
      setPreviews(makePreviews(validFiles));
      setMessage(null);
      setError(null);
      onFilesSelected?.(validFiles);
    },
    [accept, emptySelectionMessage, maxSizeMB, multiple, onFilesSelected, resetSelection],
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
      const endpoint = uploadUrl?.trim() ?? '';
      if (!endpoint) {
        throw new Error('Upload URL is not configured.');
      }

      const formData = new FormData();
      const fieldName = multiple ? 'files' : 'file';
      if (multiple) {
        for (const file of selectedFiles) {
          formData.append(fieldName, file, file.name);
        }
      } else {
        const file = selectedFiles[0];
        formData.append('file', file, file.name);
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        body: formData,
        signal: controller.signal,
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
    file: selectedFiles[0] ?? null,
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
