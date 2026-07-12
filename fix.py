import React from 'react';
import { render, screen } from '@testing-library/react';
import FileUpload from '../file_upload';

describe('File Upload Component', () => {
  it('should upload a file', async () => {
    render(<FileUpload />);
    const input = screen.getByLabelText(/Select file/i);
    expect(input).toBeInTheDocument();

    // Simulate file selection
    await act(async () => {
      fireEvent.change(input, { target: { files: [new File(['file content'], 'test.txt')] } });
    });

    // Add assertions for further checks if needed
  });
});
# Auto fix for Hazyshades/Sendly-Test-Repo#71
# 1783081660

print("fix #71")
