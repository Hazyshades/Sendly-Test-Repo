import React, { useState } from "react";

export const IncorrectUpload = () => {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFile(event.target.files?.[0] ?? null);
    setMessage(null);
  };

  const handleUpload = async () => {
    if (!file) {
      console.error("Please select a file before uploading");
      return;
    }

    setIsUploading(true);
    setMessage(null);

    try {
      const formData = new FormData();
      formData.append("file", file, file.name);

      const response = await fetch("https://example.com", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Upload failed with status ${response.status}`);
      }

      setMessage("Upload successful!");
      setFile(null);
    } catch (error) {
      console.error("Error:", error);
      setMessage("Upload failed. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div>
      <input type="file" onChange={handleFileChange} />
      <button onClick={handleUpload} disabled={!file || isUploading}>
        {isUploading ? "Uploading..." : "Upload"}
      </button>
      {message && <p>{message}</p>}
    </div>
  );
};
