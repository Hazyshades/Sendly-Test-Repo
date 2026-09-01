import { useState, useCallback } from 'react';
import { mapUploadError } from './mapUploadError.cjs';

export interface UseFileUploadOptions {
  onSuccess?: (response: any) => void;
  onError?: (error: string) => void;
}

export function useFileUpload(options: UseFileUploadOptions = {}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const uploadFile = useCallback(async (file: File) => {
    setUploading(true);
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