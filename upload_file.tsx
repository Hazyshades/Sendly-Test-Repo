import React, { useState } from 'react';

export const IncorrectUpload = () => {
  const [file, setFile] = useState<File | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      setFile(event.target.files[0]);
    } else {
      setFile(null);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      console.error('No file selected for upload.');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('fileName', file.name);
      formData.append('fileData', file);

      const response = await fetch('https://example.com', {
        method: 'POST',
        body: formData,
        // The browser automatically sets the correct Content-Type with the boundary for FormData
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
      <button onClick={handleUpload}>Upload</button>
    </div>
  );
};
