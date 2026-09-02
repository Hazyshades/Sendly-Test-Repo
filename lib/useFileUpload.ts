import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  UploadHttpError,
  getFriendlyUploadErrorMessage,
} from './mapUploadError';

export { UploadHttpError, getFriendlyUploadErrorMessage };

export interface UseFileUploadOptions {
  /** URL to upload files to */
  uploadUrl?: string;
  /** Maximum file size in MB */
  maxSizeMB?: number;
  /** Allow multiple file selection */
  multiple?: boolean;
  /** Accepted file types (MIME types or extensions) */
  accept?: string;
  /** Clear selected files after successful upload */
  clearOnSuccess?: boolean;
  /** Message to display on successful upload */
  successMessage?: string;
  /** Message to display when no files are selected */
  emptySelectionMessage?: string;
  /** Callback when files are selected */
  onFilesSelected?: (files: File[]) => void;
  /** Callback when upload succeeds */
  onSuccess?: (response: any) => void;
  /** Callback when upload fails */
  onError?: (error: string) => void;
  /** Callback when upload succeeds (alias) */
  onUploadSuccess?: () => void;
  /** Callback when upload fails (alias) */
  onUploadError?: (error: string) => void;
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
  files.forEach((file) => {
    if (file.type.startsWith('image/')) {
      urls.push(URL.createObjectURL(file));
    }
  });
  return urls;
}

/**
 * Shared upload hook: selection, validation, previews, re-entry guards,
 * abort-on-unmount, and multipart upload with friendly error mapping.
 */
export function useFileUpload(options: UseFileUploadOptions = {}): UseFileUploadReturn {
  const {
    uploadUrl,
    maxSizeMB = 10,
    multiple = false,
    accept = '*/*',
    clearOnSuccess = false,
    successMessage = 'Upload successful!',
    emptySelectionMessage = 'Please select a file before uploading.',
    onFilesSelected,
    onSuccess,
    onError,
    onUploadSuccess,
    onUploadError,
  } = options;

  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const uploadingRef = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const isMountedRef = useRef(true);
  const previewsRef = useRef<string[]>([]);

  // Revoke all existing preview object URLs, then set the new list.
  const replacePreviews = useCallback((nextPreviews: string[]) => {
    previewsRef.current.forEach((url) => {
      if (url) {
        URL.revokeObjectURL(url);
      }
    });
    previewsRef.current = nextPreviews;
    setPreviews(nextPreviews);
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedFiles([]);
    replacePreviews([]);
    setSelectedFiles([]);
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }, [replacePreviews]);

  // Check if file matches accept filter
  const isAcceptedFile = useCallback((file: File, acceptFilter: string): boolean => {
    if (!acceptFilter || acceptFilter === '*/*') return true;
    const accepted = acceptFilter.split(',').map(s => s.trim().toLowerCase());
    const fileType = file.type.toLowerCase();
    const fileName = file.name.toLowerCase();
    return accepted.some(a => {
      if (a.startsWith('.')) return fileName.endsWith(a);
      if (a.endsWith('/*')) return fileType.startsWith(a.replace('/*', '/'));
      return fileType === a;
    });
  }, []);

  const resetSelection = clearSelection;

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
      const files = multiple ? rawFiles : rawFiles.slice(0, 1);

      const validFiles: File[] = [];
      const invalidFileNames: string[] = [];
      const maxBytes = maxSizeMB !== undefined ? maxSizeMB * 1024 * 1024 : null;
      const validFiles: File[] = [];
      const invalidFileNames: string[] = [];

      for (const file of files) {
        if (!isAcceptedFile(file, accept)) {
          invalidFileNames.push(file.name);
          continue;
        }
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
        clearSelection();
        setError(
          invalidFileNames.length > 0
            ? `File "${invalidFileNames.join(', ')}" exceeds limit.`
            : emptySelectionMessage,
        );
        return;
      }

      const nextPreviews = validFiles.map((file) =>
        file.type.startsWith('image/') ? URL.createObjectURL(file) : '',
      );

      setSelectedFiles(validFiles);
      replacePreviews(nextPreviews);
      setError(
        invalidFileNames.length > 0
          ? `Skipped oversized or unaccepted file${invalidFileNames.length === 1 ? '' : 's'}: ${invalidFileNames.join(', ')}.`
          : null,
      );
      onFilesSelected?.(validFiles);
    },
    [accept, clearSelection, emptySelectionMessage, maxSizeMB, multiple, onFilesSelected],
  );

  const handleUpload = useCallback(async () => {
    const targetUrl = uploadUrl || "https://example.com";

    if (selectedFiles.length === 0) {
      setError(emptySelectionMessage);
      return;
    }

    if (uploadingRef.current) {
      return;
    }
    uploadingRef.current = true;

    if (uploadInFlightRef.current) {
      return;
    }
    uploadInFlightRef.current = true;
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

    try {
      const formData = new FormData();
      const fieldName = multiple ? 'files' : 'file';

      for (const file of selectedFiles) {
        formData.append(fieldName, file, file.name);
      }

      if (!abortControllerRef.current) {
        abortControllerRef.current = controller;
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        body: formData,
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        throw new Error(`Upload failed with status ${response.status}`);
      }

      const data = await response.json();

      if (isMountedRef.current) {
        setMessage(successMessage);
        if (clearOnSuccess) {
          clearSelection();
        }
        onSuccess?.(data);
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
      console.error('Upload error:', uploadError);
    } finally {
      if (isMountedRef.current) {
        setIsUploading(false);
        setUploading(false);
      }
      uploadingRef.current = false;
      uploadInFlightRef.current = false;
      if (isMountedRef.current) {
        setIsUploading(false);
      }
    }
  }, [
    clearOnSuccess,
    clearSelection,
    emptySelectionMessage,
    multiple,
    onError,
    onSuccess,
    onUploadError,
    onUploadSuccess,
    selectedFiles,
    successMessage,
    uploadUrl,
  ]);

  const file = selectedFiles[0] ?? null;

  return {
    file,
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
}
