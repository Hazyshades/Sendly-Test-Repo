import React, { useState } from 'react';

export const IncorrectUpload = () => {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      setFile(files[0]);
    } else {
      setFile(null);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      console.error('No file selected');
      return;
    }

    setIsUploading(true);
    try {
      // Use FormData for binary file uploads. A File cannot be serialized
      // via JSON.stringify — it would produce "{}" and the file bytes would
      // never reach the server. FormData sends the file as multipart/form-data
      // and the browser sets the correct Content-Type (including boundary)
      // automatically, so we must NOT set the Content-Type header manually.
      const formData = new FormData();
      formData.append('file', file, file.name);
      formData.append('fileName', file.name);

      const response = await fetch('https://example.com', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        console.error('Upload error:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div>
      <input type="file" onChange={handleFileChange} disabled={isUploading} />
      <button onClick={handleUpload} disabled={!file || isUploading}>
        {isUploading ? 'Uploading...' : 'Upload'}
      </button>
    </div>
  );
};
