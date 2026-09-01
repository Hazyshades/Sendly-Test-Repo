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
      inputRef.current.value = "";
    }
  }, []);

  const selectFiles = useCallback(
    (files: File[]) => {
      const maxBytes = maxSizeMB * 1024 * 1024;
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

      const newPreviews = validFiles.map((file) => {
        if (file.type.startsWith("image/")) {
          return URL.createObjectURL(file);
        }
        return "";
      });
      setPreviews(newPreviews);

      onFilesSelected?.(validFiles);
    },
    [accept, maxSizeMB, multiple, onFilesSelected, replacePreviews, clearSelection],
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
      const data = await res.json();
      options.onSuccess?.(data);
    } catch (err: any) {
      const friendlyMsg = mapUploadError(500);
      setError(friendlyMsg);
      options.onError?.(friendlyMsg);
    } finally {
      setUploading(false);
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
