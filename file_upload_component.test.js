const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const test = require('node:test');

const source = readFileSync('components/FileUpload.tsx', 'utf8');

test('FileUpload has one coherent validation loop for selected files', () => {
  assert.match(source, /const validFiles: File\[\] = \[\]/);
  assert.match(source, /const invalidFileNames: string\[\] = \[\]/);
  assert.equal((source.match(/for \(const file of files\)/g) || []).length, 1);
  assert.doesNotMatch(source, /const errors: string\[\] = \[\]/);
});

test('FileUpload skips oversized files without passing them to onFilesSelected', () => {
  assert.match(source, /if \(file\.size > maxBytes\)/);
  assert.match(source, /invalidFileNames\.push\(file\.name\)/);
  assert.match(source, /validFiles\.push\(file\)/);
  assert.match(source, /onFilesSelected\?\.\(validFiles\)/);
});

test('FileUpload resets invalid-only selections so users can select the same file again', () => {
  assert.match(source, /validFiles\.length === 0/);
  assert.match(source, /clearSelection\(\)/);
  assert.match(source, /inputRef\.current\.value = ''/);
});

test('FileUpload keeps image preview URL cleanup', () => {
  assert.match(source, /URL\.createObjectURL\(file\)/);
  assert.match(source, /URL\.revokeObjectURL\(url\)/);
});
