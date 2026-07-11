const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const test = require('node:test');

const source = readFileSync('components/FileUpload.tsx', 'utf8');

test('FileUpload keeps one validation loop for selected files', () => {
  const loopMatches = source.match(/for \(const file of files\)/g) || [];
  assert.equal(loopMatches.length, 1);
  assert.match(source, /const validFiles: File\[\] = \[\]/);
  assert.match(source, /const invalidFileNames: string\[\] = \[\]/);
});

test('FileUpload resets invalid selections and only reports valid files', () => {
  assert.match(source, /inputRef\.current\.value = ''/);
  assert.match(source, /setSelectedFiles\(validFiles\)/);
  assert.match(source, /onFilesSelected\(validFiles\)/);
  assert.doesNotMatch(source, /onFilesSelected\(files\)/);
});
