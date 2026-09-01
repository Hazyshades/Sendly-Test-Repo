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

export function useFileUpload(options: UseFileUploadOptions = {}): UseFileUploadReturn {
  const {
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
  const previewsRef = useRef<string[]>([]);

  const file = selectedFiles[0] ?? null;

  useEffect(() => {
    previewsRef.current = previews;
  }, [previews]);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      uploadingRef.current = false;
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

  const replacePreviews = useCallback((nextPreviews: string[]) => {
    previewsRef.current.forEach((url) => {
      if (url) {
        URL.revokeObjectURL(url);
      }
    });
    setPreviews(nextPreviews);
    previewsRef.current = nextPreviews;
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

      const newPreviews = validFiles.map((file) => {
        if (file.type.startsWith('image/')) {
          return URL.createObjectURL(file);
        }
        return '';
      });

      setError(
        invalidFileNames.length > 0
          ? `Skipped oversized file${invalidFileNames.length === 1 ? '' : 's'}: ${invalidFileNames.join(', ')}.`
          : null,
      );

      replacePreviews(newPreviews);
      setSelectedFiles(validFiles);
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
    if (!uploadUrl) {
      setError('Upload URL is not configured.');
      return;
    }

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

    try {
      const formData = new FormData();
      const fieldName = multiple ? 'files' : 'file';

      for (const file of selectedFiles) {
        if (multiple) {
          formData.append(fieldName, file, file.name);
        } else {
          formData.append('file', file, file.name);
        }
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
        setError(uploadErrorMessage);
        onUploadError?.(uploadErrorMessage);
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


/*
  const uploadInFlightRef = useRef(false);
  if (uploadInFlightRef.current) { return; } uploadInFlightRef.current = true;
  finally { uploadInFlightRef.current = false; signal: controller.signal;
*/

if (!uploadUrl) {
  setError('Upload URL is not configured.');
  return;
}

// file: selectedFiles[0] ?? null

/*
 * Validation contract (shared with FileUpload component):
 *
 *   const validFiles: File[] = [];
 *   const errors: string[] = [];
 *   const maxBytes = maxSizeMB !== undefined ? maxSizeMB * 1024 * 1024 : null;
 *   for (const file of candidates) {
 *     if (maxBytes !== null && file.size > maxBytes) {
 *       errors.push(file.name);
 *       continue;
 *     }
 *     validFiles.push(file);
 *   }
 *   if (validFiles.length === 0) {
 *     resetSelection();
 *     return;
 *   }
 *   onFilesSelected?.(validFiles);
 */
