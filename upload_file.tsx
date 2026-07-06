import React, { useState } from 'react';

export const IncorrectUpload = () => {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFile(event.target.files?.[0] ?? null);
  };

  const handleUpload = async () => {
    if (!file) {
      console.error('Please select a file before uploading');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('fileName', file.name);

    setIsUploading(true);

    try {
      const response = await fetch('https://example.com', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        console.error('Upload error');
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div>
      <input type="file" onChange={handleFileChange} />
      <button onClick={handleUpload} disabled={!file || isUploading}>
        {isUploading ? 'Uploading...' : 'Upload'}
      </button>
    </div>
  );
};
