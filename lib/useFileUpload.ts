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
 * Decide whether a file matches the accept filter.
 * Top-level helper so the rule lives in one place (see #251).
 */
export function isAcceptedFile(file: File, accept?: string): boolean {
  if (!accept || accept.trim() === '') {
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

  // Abort any in-flight request and revoke preview URLs on unmount.
  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
      previewsRef.current.forEach((url) => {
        if (url) {
          URL.revokeObjectURL(url);
        }
      });
    };
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedFiles([]);
    setPreviews((prevUrls) => {
      prevUrls.forEach((url) => {
        if (url) {
          URL.revokeObjectURL(url);
        }
      });
      return [];
    });
    setMessage(null);
    setError(null);
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  }, []);

  const commitSelection = useCallback(
    (filesToCommit: File[]) => {
      previews.forEach((url) => {
        if (url) {
          URL.revokeObjectURL(url);
        }
      });

      const newPreviews = filesToCommit.map((f) => {
        if (f.type.startsWith('image/')) {
          return URL.createObjectURL(f);
        }
        return '';
      });

      setSelectedFiles(filesToCommit);
      setPreviews(newPreviews);
      setMessage(null);
      setError(null);
      onFilesSelected?.(filesToCommit);
    },
    [previews, onFilesSelected]
  );

  const handleFileChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const rawFiles = event.target.files;
      if (!rawFiles || rawFiles.length === 0) {
        commitSelection([]);
        return;
      }

      const fileList = Array.from(rawFiles);
      const validFiles: File[] = [];

      for (const f of fileList) {
        if (!isAcceptedFile(f, accept)) {
          continue;
        }
        if (maxSizeMB !== undefined && f.size > maxSizeMB * 1024 * 1024) {
          continue;
        }
        validFiles.push(f);
      }

      if (validFiles.length === 0 && fileList.length > 0) {
        setError(`Selected file(s) did not meet validation criteria (type or size).`);
        setSelectedFiles([]);
        setPreviews([]);
        return;
      }

      const filesToCommit = multiple ? validFiles : validFiles.slice(0, 1);
      commitSelection(filesToCommit);
    },
    [accept, maxSizeMB, multiple, commitSelection]
  );

  const resetSelection = useCallback(() => {
    clearSelection();
  }, [clearSelection]);

  const handleUpload = useCallback(async () => {
    if (uploadingRef.current || uploadInFlightRef.current) {
      return;
    }

    if (selectedFiles.length === 0) {
      setError(emptySelectionMessage);
      return;
    }

    if (!uploadUrl) {
      setError('No upload URL configured.');
      return;
    }

    uploadingRef.current = true;
    uploadInFlightRef.current = true;
    setIsUploading(true);
    setError(null);
    setMessage(null);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const formData = new FormData();
      if (!multiple) {
        formData.append('file', file, file.name);
      } else {
        selectedFiles.forEach((f) => {
          formData.append('files', f, f.name);
        });
      }

      const response = await fetch(uploadUrl, {
        method: 'POST',
        body: formData,
        signal: controller.signal,
      });

      if (!response.ok) {
        let errorData: any = {};
        try {
          errorData = await response.json();
        } catch {
          // ignore JSON parse failure
        }
        throw new UploadHttpError(
          response.status,
          errorData.message || response.statusText,
          errorData
        );
      }

      setMessage(successMessage);
      if (clearOnSuccess) {
        clearSelection();
      }
      onUploadSuccess?.();
    
    } catch (err: any) {
      if (err.name === 'AbortError') {
        return;
      }
      const friendlyMsg = getFriendlyUploadErrorMessage(err);
      setError(friendlyMsg);
      onUploadError?.(friendlyMsg);
    } finally {
      uploadingRef.current = false;
      uploadInFlightRef.current = false;
      setIsUploading(false);
      abortControllerRef.current = null;
    }
  }, [
    selectedFiles,
    multiple,
    uploadUrl,
    successMessage,
    emptySelectionMessage,
    clearOnSuccess,
    clearSelection,
    onUploadSuccess,
    onUploadError,
    file,
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