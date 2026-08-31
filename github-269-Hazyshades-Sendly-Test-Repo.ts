import { useFileUpload } from '../hooks/useFileUpload';

interface FileUploadProps {
  onUploadComplete: (url: string) => void;
  onError: (error: Error) => void;
  endpoint: string;
  allowedTypes?: string[];
  maxSizeMB?: number;
}

const FileUpload: React.FC<FileUploadProps> = ({
  onUploadComplete,
  onError,
  endpoint,
  allowedTypes = ['image/png', 'image/jpeg', 'image/gif'],
  maxSizeMB = 10,
}) => {
  const {
    file,
    setFile,
    isUploading,
    error,
    progress,
    upload,
  } = useFileUpload({
    endpoint,
    allowedTypes,
    maxSizeMB,
    onUploadComplete,
    onError,
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files?.[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleUploadClick = () => {
    if (file) {
      upload(file);
    }
  };

  return (
    <div className="file-upload">
      <div
        className="drop-zone"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
        <input
          type="file"
          onChange={handleFileChange}
          accept={allowedTypes.join(',')}
          style={{ display: 'none' }}
          id="file-input"
        />
        <label htmlFor="file-input" className="file-label">
          {file ? file.name : 'Drag & drop or click to upload'}
        </label>
      </div>
      {error && <div className="error">{error.message}</div>}
      {progress > 0 && progress < 100 && (
        <div className="progress-bar">
          <div className="progress" style={{ width: `${progress}%` }} />
        </div>
      )}
      <button
        onClick={handleUploadClick}
        disabled={!file || isUploading}
        className="upload-btn"
      >
        {isUploading ? 'Uploading...' : 'Upload'}
      </button>
    </div>
  );
};

export default FileUpload;