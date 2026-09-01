const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const test = require('node:test');
const { assertValidationContract } = require('./file_upload_contract.cjs');

const source = readFileSync('components/FileUpload.tsx', 'utf8');
const hookSource = readFileSync('lib/useFileUpload.ts', 'utf8');

test('FileUpload delegates state, validation, and upload work to useFileUpload', () => {
  assert.match(source, /useFileUpload\s*\(/);
  assert.doesNotMatch(source, /\bfetch\s*\(/);
  assert.doesNotMatch(source, /new\s+FormData\s*\(/);
  assert.doesNotMatch(source, /useState/);
  assertValidationContract(hookSource);
});

test('useFileUpload uploads files as multipart FormData', () => {
  assert.match(hookSource, /new\s+FormData\s*\(/);
  assert.match(hookSource, /\.append\(fieldName, file, file\.name\)/);
  assert.doesNotMatch(hookSource, /JSON\.stringify/);
  assert.doesNotMatch(hookSource, /Content-Type['"]?\s*:\s*['"]application\/json/);
});

test('useFileUpload guards empty and concurrent submissions', () => {
  assert.match(source, /disabled=\{isUploading \|\| uploadingRef\.current\}/);
  assert.match(hookSource, /if\s*\(\s*selectedFiles\.length === 0\s*\)/);
  assert.match(hookSource, /const uploadingRef = useRef\(false\)/);
  assert.match(
    hookSource,
    /if \(uploadingRef\.current\) \{[\s\S]*?return;[\s\S]*?uploadingRef\.current = true;/,
  );
  assert.match(hookSource, /finally \{[\s\S]*uploadingRef\.current = false;/);
});

test('FileUpload exposes stable accessible labels and status references', () => {
  assert.match(source, /<label htmlFor="file-upload-input"/);
  assert.match(source, /id=\{inputId\}/);
  assert.match(source, /aria-describedby=\{describedBy \|\| undefined\}/);
  assert.match(source, /<p id="file-upload-error" role="alert"/);
  assert.match(source, /<p id="file-upload-status" role="status"/);
});
