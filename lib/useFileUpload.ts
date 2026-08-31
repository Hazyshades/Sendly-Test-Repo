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
  inputRef: React.RefObject<HTMLInputElement | null>;
  handleFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  handleUpload: () => Promise<void>;
  handleRemove: () => void;
  uploadingRef: React.MutableRefObject<boolean>;
  clearSelection: () => void;
}

function isAcceptedFile(file: File, accept?: string): boolean {
  if (!accept) return true;
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
}

export function useFileUpload(options: UseFileUploadOptions = {}): UseFileUploadReturn {
  const {
    uploadUrl,
    accept = '',
    maxSizeMB = 5,
    multiple = false,
    clearOnSuccess = false,
    successMessage = 'Upload successful!',
    emptySelectionMessage = 'Please select a file before uploading.',
    onFilesSelected,
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
  const uploadInFlightRef = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const isMountedRef = useRef(true);

  const file = selectedFiles[0] ?? null;

  const clearSelection = useCallback(() => {
    setSelectedFiles([]);
    setPreviews([]);
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  }, []);

  const selectFiles = useCallback(
    (files: File[]) => {
      const maxBytes = maxSizeMB * 1024 * 1024;
      const validFiles: File[] = [];
      const invalidFileNames: string[] = [];

      for (const f of files) {
        if (f.size > maxBytes) {
          invalidFileNames.push(f.name);
          continue;
        }

        if (!isAcceptedFile(f, accept)) {
          invalidFileNames.push(f.name);
          continue;
        }

        validFiles.push(f);
      }

      setMessage(null);

      if (validFiles.length === 0) {
        clearSelection();
        setError(
          invalidFileNames.length > 0
            ? `File${invalidFileNames.length === 1 ? '' : 's'} "${invalidFileNames.join(', ')}" exceed${
                invalidFileNames.length === 1 ? 's' : ''
              } ${maxSizeMB}MB limit.`
            : 'No valid files selected.',
        );
        return;
      }

      setError(
        invalidFileNames.length > 0
          ? `Skipped oversized or unaccepted file${invalidFileNames.length === 1 ? '' : 's'}: ${invalidFileNames.join(', ')}.`
          : null,
      );
      setSelectedFiles(validFiles);

      const newPreviews = validFiles.map((f) => {
        if (f.type.startsWith('image/')) {
          return URL.createObjectURL(f);
        }
        return '';
      });
      setPreviews(newPreviews);

      onFilesSelected?.(validFiles);
    },
    [accept, clearSelection, maxSizeMB, onFilesSelected],
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
    const targetUrl = uploadUrl || 'https://example.com';

    if (selectedFiles.length === 0) {
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
    setIsUploading(true);
    setMessage(null);
    setError(null);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const formData = new FormData();
      const fieldName = multiple ? 'files' : 'file';

      for (const f of selectedFiles) {
        formData.append(fieldName, f, f.name);
      }

      const response = await fetch(targetUrl, {
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
      if (
        uploadError instanceof Error &&
        (uploadError.name === 'AbortError' || uploadError.name === 'CanceledError')
      ) {
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
    isUploading,
    multiple,
    onUploadError,
    onUploadSuccess,
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
      uploadingRef.current = false;
      abortControllerRef.current?.abort();
      abortControllerRef.current = null;
      previews.forEach((url) => {
        if (url) {
          URL.revokeObjectURL(url);
        }
      });
    };
  }, [previews]);

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
    uploadingRef,
    clearSelection,
  };
}
