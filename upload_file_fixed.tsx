import React, { useState, useCallback } from "react";

interface UploadResult {
  success: boolean;
  message?: string;
  error?: string;
}

export const CorrectedUpload: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<UploadResult | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0] ?? null;
    
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf', 
                         'text/plain', 'application/json'];
    if (selectedFile && !allowedTypes.includes(selectedFile.type)) {
      setResult({ success: false, error: `Unsupported file type: ${selectedFile.type}` });
      return;
    }
    
    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024;
    if (selectedFile && selectedFile.size > maxSize) {
      setResult({ success: false, error: 'File too large (max 10MB)' });
      return;
    }
    
    setFile(selectedFile);
    setResult(null);
    setProgress(0);
  };

  const handleUpload = async () => {
    if (!file) {
      setResult({ success: false, error: 'Please select a file first' });
      return;
    }

    setIsUploading(true);
    setProgress(0);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file, file.name);

      // Use XMLHttpRequest for progress tracking
      await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        
        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            setProgress(Math.round((e.loaded / e.total) * 100));
          }
        });

        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(xhr.responseText);
          } else {
            reject(new Error(`Upload failed: ${xhr.status} ${xhr.statusText}`));
          }
        });

        xhr.addEventListener('error', () => {
          reject(new Error('Network error during upload'));
        });

        xhr.open('POST', 'https://example.com/upload');
        xhr.send(formData);
      });

      setResult({ success: true, message: 'Upload successful!' });
      setFile(null);
      setProgress(100);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Upload failed';
      setResult({ success: false, error: msg });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '400px' }}>
      <h2>File Upload</h2>
      
      <input 
        type="file" 
        onChange={handleFileChange}
        disabled={isUploading}
        accept=".jpg,.jpeg,.png,.pdf,.txt,.json"
      />
      
      {file && (
        <p>Selected: {file.name} ({(file.size / 1024).toFixed(2)} KB)</p>
      )}
      
      {progress > 0 && (
        <div>
          <progress value={progress} max={100} style={{ width: '100%' }} />
          <p>{progress}% uploaded</p>
        </div>
      )}
      
      <button 
        onClick={handleUpload} 
        disabled={!file || isUploading}
      >
        {isUploading ? 'Uploading...' : 'Upload'}
      </button>
      
      {result?.success && result.message && (
        <p style={{ color: 'green' }}>{result.message}</p>
      )}
      
      {result?.error && (
        <p style={{ color: 'red' }}>{result.error}</p>
      )}
    </div>
  );
};
