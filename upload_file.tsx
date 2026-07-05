import React, { useState } from "react";

const UPLOAD_URL = "https://example.com";

export const IncorrectUpload = () => {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMessage(null);
    setFile(event.currentTarget.files?.item(0) ?? null);
  };

  const handleUpload = async () => {
    if (!file || isUploading) {
      return;
    }

    const formData = new FormData();
    formData.append("file", file, file.name);

    try {
      setIsUploading(true);
      setErrorMessage(null);

      const response = await fetch(UPLOAD_URL, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Upload failed with status ${response.status}`);
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Upload failed");
      console.error("Error:", error);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div>
      <input type="file" onChange={handleFileChange} />
      <button type="button" onClick={handleUpload} disabled={!file || isUploading}>
        {isUploading ? "Uploading..." : "Upload"}
      </button>
      {errorMessage && <p role="alert">{errorMessage}</p>}
    </div>
  );
};
