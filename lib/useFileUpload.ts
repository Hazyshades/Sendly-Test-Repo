import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  UploadHttpError,
  getFriendlyUploadErrorMessage,
} from './mapUploadError';

export { UploadHttpError, getFriendlyUploadErrorMessage };

export interface UseFileUploadOptions {
  uploadUrl?: string;
  maxSizeMB?: number;
  multiple?: boolean;
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

export function useFileUpload(options: UseFileUploadOptions = {}): UseFileUploadReturn {
  const {
    uploadUrl,
    maxSizeMB,
    multiple = false,
    onFilesSelected,
    onUploadSuccess,
    onUploadError,
  } = options;

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
  maxSizeMB = 5,
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
  const uploadingRef = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const file = selectedFiles[0] ?? null;

  const setFile: React.Dispatch<React.SetStateAction<File | null>> = useCallback(
    (action) => {
      setSelectedFiles((prev) => {
        const currentFile = prev[0] ?? null;
        const nextFile = typeof action === "function" ? action(currentFile) : action;
        return nextFile ? [nextFile] : [];
      });
    },
    [],
  );

  const clearSelection = useCallback(() => {
    setSelectedFiles([]);
    setPreviews([]);
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedFiles([]);
    replacePreviews([]);
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  }, [replacePreviews]);

  const selectFiles = useCallback(
    (files: File[]) => {
      const maxBytes = maxSizeMB * 1024 * 1024;
      const validFiles: File[] = [];
      const invalidFileNames: string[] = [];

      for (const file of files) {
        if (file.size > maxBytes) {
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
            ? `File${invalidFileNames.length === 1 ? '' : 's'} "${invalidFileNames.join(', ')}" exceed${
                invalidFileNames.length === 1 ? 's' : ''
              } ${maxSizeMB}MB limit.`
            : 'No valid files selected.',
        );
        return;
      }

      const nextPreviews = validFiles.map((file) =>
        file.type.startsWith('image/') ? URL.createObjectURL(file) : '',
      );

      setError(
        invalidFileNames.length > 0
          ? `Skipped oversized file${invalidFileNames.length === 1 ? '' : 's'}: ${invalidFileNames.join(', ')}.`
          : null,
      );
      setSelectedFiles(validFiles);

      const newPreviews = validFiles.map((file) => {
        if (file.type.startsWith("image/")) {
          return URL.createObjectURL(file);
        }
        return "";
      });
      setPreviews(newPreviews);

      onFilesSelected?.(validFiles);
    },
    [accept, clearSelection, maxSizeMB, onFilesSelected, replacePreviews],
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
      setError("Please select a file before uploading.");
      return;
    }

    if (uploadingRef.current) {
      return;
    }

    uploadingRef.current = true;
    const controller = new AbortController();
    abortControllerRef.current = controller;

    if (isUploading) {
      return;
    }

    setIsUploading(true);
    setMessage(null);
    setError(null);

    abortControllerRef.current = new AbortController();

    try {
      const formData = new FormData();
      const fieldName = multiple ? "files" : "file";

      for (const file of selectedFiles) {
        if (multiple) {
          formData.append(fieldName, file, file.name);
        } else {
          formData.append("file", file, file.name);
        }
      }

      const response = await fetch(targetUrl, {
        method: "POST",
        body: formData,
        signal: abortControllerRef.current.signal,
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
        uploadingRef.current = false;
        if (isMountedRef.current) {
          setIsUploading(false);
        }
      }
      setIsUploading(false);
      abortControllerRef.current = null;
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

  const handleRemove = useCallback(() => {
    clearSelection();
    setError(null);
    setMessage(null);
  }, [clearSelection]);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      uploadingRef.current = false;
      abortControllerRef.current?.abort();
      abortControllerRef.current = null;
      previewsRef.current.forEach((url) => {
      previews.forEach((url) => {
        if (url) {
          URL.revokeObjectURL(url);
        }
      });
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
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
