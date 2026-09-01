import { useState, useCallback } from 'react';
import { mapUploadError } from './mapUploadError.cjs';

export interface UseFileUploadOptions {
  onSuccess?: (response: any) => void;
  onError?: (error: string) => void;
}

export function useFileUpload(options: UseFileUploadOptions = {}) {
  const [uploading, setUploading] = useState(false);
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
    setPreviews((prev) => {
      prev.forEach((url) => {
        if (url) {
          URL.revokeObjectURL(url);
        }
      });
      return [];
    });
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }, []);

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
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      if (!res.ok) {
        const userFriendlyError = mapUploadError(res.status);
        setError(userFriendlyError);
        options.onError?.(userFriendlyError);
        return;
      }
      const data = await res.json();
      options.onSuccess?.(data);
    } catch (err: any) {
      const friendlyMsg = mapUploadError(500);
      setError(friendlyMsg);
      options.onError?.(friendlyMsg);
    } finally {
      setUploading(false);
    }
  }, [options]);

  return { uploadFile, uploading, error };
}