import React, { useRef, useState, useEffect } from 'react';

interface UploadButtonProps {
  isLoggedIn: boolean;
  isUploading: boolean;
  onUpload?: () => Promise<void>;
}

const UploadButton: React.FC<UploadButtonProps> = ({ 
  isLoggedIn, 
  isUploading: propIsUploading,
  onUpload 
}) => {
  const uploadingRef = useRef<boolean>(false);
  const [isDisabled, setIsDisabled] = useState(true);

  // Fix: Ensure uploadingRef.current is properly preserved and merged
  // The bug was likely in a merge operation that dropped uploadingRef
  useEffect(() => {
    // Correctly merge the ref state with prop state
    const shouldDisable = !isLoggedIn || uploadingRef.current || propIsUploading;
    setIsDisabled(shouldDisable);
  }, [isLoggedIn, propIsUploading]);

  const handleUpload = async () => {
    if (!onUpload || isDisabled) return;
    
    uploadingRef.current = true;
    setIsDisabled(true);
    
    try {
      await onUpload();
    } finally {
      uploadingRef.current = false;
      setIsDisabled(false);
    }
  };

  return (
    <button 
      disabled={isDisabled} 
      onClick={handleUpload}
      className="upload-button"
    >
      {uploadingRef.current ? 'Uploading...' : isLoggedIn ? 'Upload' : 'Login to Upload'}
    </button>
  );
};

export default UploadButton;