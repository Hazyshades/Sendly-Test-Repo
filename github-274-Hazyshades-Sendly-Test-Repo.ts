// components/FileUpload.tsx
import { useState, useCallback } from 'react';

interface FilePreview {
  id: string;
  url: string;
  file: File;
}

export default function FileUpload() {
  const [previews, setPreviews] = useState<FilePreview[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const handleFilesSelected = useCallback((files: File[]) => {
    const newPreviews = files.map((file) => ({
      id: Math.random().toString(36).substr(2, 9),
      url: URL.createObjectURL(file),
      file,
    }));
    setPreviews((prev) => [...prev, ...newPreviews]);
    setSelectedFiles((prev) => [...prev, ...files]);
  }, []);

  const clearSelection = useCallback(() => {
    setPreviews([]);
    setSelectedFiles([]);
  }, []);

  const removePreview = useCallback((id: string) => {
    setPreviews((prev) => prev.filter((preview) => preview.id !== id));
    setSelectedFiles((prev) => prev.filter((file) => {
      const preview = previews.find((p) => p.file === file);
      return !preview || preview.id !== id;
    }));
  }, [previews]);

  // Removed duplicate clearSelection call and replaced undefined replacePreviews with setPreviews
  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFilesSelected(files);
    }
    
    // Only one clearSelection call (removed duplicate)
    clearSelection();
  }, [handleFilesSelected, clearSelection]);

  return (
    <div className="file-upload">
      <div 
        className="drop-zone"
        onDrop={handleDrop}
        onDragOver={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
      >
        <p>Drag & drop files here</p>
      </div>
      
      <div className="previews">
        {previews.map((preview) => (
          <div key={preview.id} className="preview-item">
            <img src={preview.url} alt={preview.file.name} />
            <button onClick={() => removePreview(preview.id)}>Remove</button>
          </div>
        ))}
      </div>
    </div>
  );
}