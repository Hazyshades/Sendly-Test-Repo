import React, { useState } from 'react';

export const IncorrectUpload = () => {
  const [file, setFile] = useState<File | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFile(event.target.files?.[0] ?? null);
  };

  const handleUpload = async () => {
    if (!file) {
      console.error('Please select a file before uploading.');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('file', file, file.name);

      const response = await fetch('https://example.com', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        console.error('Upload error');
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  return (
    <div>
      <input type="file" onChange={handleFileChange} />
      <button type="button" onClick={handleUpload} disabled={!file}>
        Upload
      </button>
    </div>
  );
};
