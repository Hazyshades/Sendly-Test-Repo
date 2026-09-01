// file_upload_component.test.js
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import FileUpload from './FileUpload';
import { useFileUpload } from './useFileUpload';

// Mock the hook to isolate component behavior
jest.mock('./useFileUpload', () => ({
  __esModule: true,
  useFileUpload: jest.fn(),
}));

describe('FileUpload', () => {
  const mockFiles = [
    new File(['content'], 'test.txt', { type: 'text/plain' }),
    new File(['image content'], 'photo.jpg', { type: 'image/jpeg' })
  ];

  const mockErrorFile = new File([''], 'malformed.pdf', { type: 'application/pdf' });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders preview for each valid file', () => {
    useFileUpload.mockReturnValue({
      files: mockFiles,
      error: null,
      onFilesSelected: jest.fn(),
      removeFile: jest.fn()
    });

    render(<FileUpload />);

    expect(screen.getByText('test.txt')).toBeInTheDocument();
    expect(screen.getByText('photo.jpg')).toBeInTheDocument();
  });

  test('validates file types per hook contract', () => {
    const allowedTypes = ['image/png', 'image/jpeg'];
    useFileUpload.mockReturnValue({
      files: [],
      error: 'Invalid file type: text/plain',
      onFilesSelected: jest.fn(),
      removeFile: jest.fn()
    });

    render(<FileUpload />);

    expect(screen.getByText(/Invalid file type/)).toBeInTheDocument();
  });

  test('handles file size limits per hook contract', () => {
    const maxSize = 5 * 1024 * 1024; // 5MB
    const largeFile = new File(['x'.repeat(6 * 1024 * 1024)], 'large.txt', { type: 'text/plain' });

    useFileUpload.mockReturnValue({
      files: [],
      error: `File exceeds maximum size of ${maxSize / (1024 * 1024)}MB`,
      onFilesSelected: jest.fn(),
      removeFile: jest.fn()
    });

    render(<FileUpload />);

    expect(screen.getByText(/exceeds maximum size/)).toBeInTheDocument();
  });

  test('calls onFilesSelected when files are added', async () => {
    const onFilesSelected = jest.fn();
    useFileUpload.mockReturnValue({
      files: [],
      error: null,
      onFilesSelected,
      removeFile: jest.fn()
    });

    render(<FileUpload />);

    const input = screen.getByRole('textbox'); // Assuming file input is accessible via role
    const file = new File(['content'], 'test.txt', { type: 'text/plain' });
    
    // Simulate file selection via change event
    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(onFilesSelected).toHaveBeenCalledWith([file]);
    });
  });

  test('removes file via removeFile callback', async () => {
    const removeFile = jest.fn();
    useFileUpload.mockReturnValue({
      files: mockFiles,
      error: null,
      onFilesSelected: jest.fn(),
      removeFile
    });

    render(<FileUpload />);

    const removeButtons = screen.getAllByRole('button', { name: /remove/i });
    fireEvent.click(removeButtons[0]);

    await waitFor(() => {
      expect(removeFile).toHaveBeenCalledWith(mockFiles[0]);
    });
  });

  test('handles hook errors gracefully', () => {
    useFileUpload.mockReturnValue({
      files: [],
      error: 'Maximum file count reached',
      onFilesSelected: jest.fn(),
      removeFile: jest.fn()
    });

    render(<FileUpload />);

    expect(screen.getByText(/Maximum file count/)).toBeInTheDocument();
  });
});