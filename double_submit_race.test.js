const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const test = require('node:test');

const hookSource = readFileSync('lib/useFileUpload.ts', 'utf8');

test('Login.tsx wires uploadingRef into disabled while delegating to useFileUpload', () => {
  const source = readFileSync('Login.tsx', 'utf8');
  assert.match(source, /useFileUpload\s*\(/);
  assert.match(source, /uploadingRef/);
  assert.match(source, /disabled=\{!file \|\| isUploading \|\| uploadingRef\.current\}/);
  assert.match(hookSource, /const uploadingRef = useRef\(false\)/);
  assert.match(
    hookSource,
    /if \(uploadingRef\.current\) \{[\s\S]*?return;[\s\S]*?uploadingRef\.current = true;/,
  );
});

test('upload_file.tsx delegates upload re-entry guard to Login/useFileUpload', () => {
  const wrapperSource = readFileSync('upload_file.tsx', 'utf8');
  const loginSource = readFileSync('Login.tsx', 'utf8');
  assert.match(wrapperSource, /export \{ IncorrectUpload \} from ['"]\.\/Login['"]/);
  assert.doesNotMatch(wrapperSource, /uploadingRef\s*=\s*useRef/);
  assert.match(hookSource, /const uploadingRef = useRef\(false\)/);
  assert.match(loginSource, /disabled=\{!file \|\| isUploading \|\| uploadingRef\.current\}/);
});

test('FileUpload.tsx wires uploadingRef into disabled via useFileUpload', () => {
  const source = readFileSync('components/FileUpload.tsx', 'utf8');
  assert.match(source, /useFileUpload\s*\(/);
  assert.match(source, /disabled=\{isUploading \|\| uploadingRef\.current\}/);
  assert.match(hookSource, /const uploadingRef = useRef\(false\)/);
});

test('useFileUpload.ts has a synchronous ref guard to prevent re-entry', () => {
  const source = readFileSync('lib/useFileUpload.ts', 'utf8');
  assert.match(source, /const uploadingRef = useRef\(false\)/);
  assert.match(
    source,
    /if \(uploadingRef\.current\) \{[\s\S]*?return;[\s\S]*?uploadingRef\.current = true;/,
  );
  assert.match(source, /finally \{[\s\S]*uploadingRef\.current = false;/);
});

test('FileUpload.tsx delegates upload re-entry guard to useFileUpload', () => {
  const source = readFileSync('components/FileUpload.tsx', 'utf8');
  assert.match(source, /disabled=\{isUploading \|\| uploadingRef\.current\}/);
  assert.match(hookSource, /const uploadingRef = useRef\(false\)/);
  assert.match(
    hookSource,
    /if \(uploadingRef\.current\) \{[\s\S]*?return;[\s\S]*?uploadingRef\.current = true;/,
  );
  assert.match(hookSource, /finally \{[\s\S]*uploadingRef\.current = false;/);
});
