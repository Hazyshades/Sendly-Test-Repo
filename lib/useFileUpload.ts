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

  // Single clearSelection implementation
  const clearSelection = useCallback(() => {
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

      setError(
        invalidFileNames.length > 0
          ? `Some files were skipped: ${invalidFileNames.join(', ')}`
          : null,
      );
      setSelectedFiles(validFiles);

      const newPreviews = validFiles.map((file) => {
        if (file.type.startsWith("image/")) {
          return URL.createObjectURL(file);
        }
        return "";
      });
      replacePreviews(newPreviews);

      onFilesSelected?.(validFiles);
    },
    [accept, maxSizeMB, multiple, onFilesSelected, replacePreviews, clearSelection, isAcceptedFile],
  );

  const handleFileChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const rawFiles = Array.from(event.target.files ?? []);
      const files = multiple ? rawFiles : rawFiles.slice(0, 1);
      selectFiles(files);
    },
    [multiple, selectFiles],
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

      const response = await fetch(targetUrl, {
        method: 'POST',
        body: formData,
        signal: controller.signal,
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
      const friendlyMsg = uploadError instanceof Error ? uploadError.message : 'Upload failed';
      if (isMountedRef.current) {
        setError(friendlyMsg);
        onError?.(friendlyMsg);
        onUploadError?.(friendlyMsg);
      }
    } finally {
      if (isMountedRef.current) {
        setIsUploading(false);
        setUploading(false);
      }
      uploadingRef.current = false;
      abortControllerRef.current = null;
    }
  }, [
    clearOnSuccess,
    emptySelectionMessage,
    multiple,
    onError,
    onSuccess,
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
}
