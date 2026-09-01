// file_upload_component.test.js
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import FileUploadComponent from './FileUploadComponent';
import { useFileUpload } from './useFileUpload';

// Mock the shared hook to verify it's called correctly
jest.mock('./useFileUpload', () => ({
  __esModule: true,
  useFileUpload: jest.fn(),
}));

describe('FileUploadComponent', () => {
  const mockFiles = [
    new File(['content'], 'test.txt', { type: 'text/plain' }),
    new File(['data'], 'image.png', { type: 'image/png' })
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders file previews correctly', () => {
    useFileUpload.mockReturnValue({
      files: mockFiles,
      removeFile: jest.fn(),
      uploadStatus: 'idle',
      uploadProgress: 0
    });

    render(<FileUploadComponent />);

    expect(screen.getByText('test.txt')).toBeInTheDocument();
    expect(screen.getByText('image.png')).toBeInTheDocument();
  });

  it('calls useFileUpload hook with correct initial state', () => {
    useFileUpload.mockReturnValue({
      files: [],
      removeFile: jest.fn(),
      uploadStatus: 'idle',
      uploadProgress: 0
    });

    render(<FileUploadComponent />);

    expect(useFileUpload).toHaveBeenCalledWith({
      maxFiles: undefined,
      maxSize: undefined,
      acceptedFileTypes: undefined
    });
  });

  it('handles file selection via hook contract', () => {
    const mockSetFiles = jest.fn();
    useFileUpload.mockReturnValue({
      files: [],
      removeFile: jest.fn(),
      uploadStatus: 'idle',
      uploadProgress: 0,
      setFiles: mockSetFiles
    });

    render(<FileUploadComponent />);

    const input = screen.getByRole('fileinput');
    fireEvent.change(input, { target: { files: mockFiles } });

    expect(mockSetFiles).toHaveBeenCalledWith(mockFiles);
  });

  it('handles file removal via hook contract', () => {
    const mockRemoveFile = jest.fn();
    useFileUpload.mockReturnValue({
      files: mockFiles,
      removeFile: mockRemoveFile,
      uploadStatus: 'idle',
      uploadProgress: 0
    });

    render(<FileUploadComponent />);

    const removeButtons = screen.getAllByRole('button', { name: /remove/i });
    fireEvent.click(removeButtons[0]);

    expect(mockRemoveFile).toHaveBeenCalledWith(mockFiles[0]);
  });

  it('updates upload progress via hook contract', () => {
    useFileUpload.mockReturnValue({
      files: mockFiles,
      removeFile: jest.fn(),
      uploadStatus: 'uploading',
      uploadProgress: 50
    });

    render(<FileUploadComponent />);

    expect(screen.getByText(/50%/)).toBeInTheDocument();
  });
});