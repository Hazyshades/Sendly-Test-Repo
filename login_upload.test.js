const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const test = require('node:test');

const source = readFileSync('Login.tsx', 'utf8');
const hookSource = readFileSync('lib/useFileUpload.ts', 'utf8');

test('Login sends binary data through the shared multipart uploader', () => {
  assert.match(source, /useFileUpload\s*\(/);
  assert.match(hookSource, /new\s+FormData\s*\(/);
  assert.match(hookSource, /\.append\(fieldName, file, file\.name\)/);
  assert.doesNotMatch(hookSource, /JSON\.stringify/);
  assert.doesNotMatch(hookSource, /Content-Type['"]?\s*:\s*['"]application\/json/);
});

test('Login delegates file selection to the shared hook', () => {
  assert.doesNotMatch(source, /useState/);
  assert.doesNotMatch(source, /\bfetch\s*\(/);
  assert.match(hookSource, /file: selectedFiles\[0\] \?\? null/);
  assert.match(source, /handleFileChange/);
});

test('Login declares maxSizeMB prop and passes it through to the hook (not hardcoded)', () => {
  // The prop must be declared on the interface
  assert.match(source, /maxSizeMB\?\s*:\s*number/);
  // A documented default must exist (DEFAULT_MAX_SIZE_MB = 5)
  assert.match(source, /DEFAULT_MAX_SIZE_MB\s*=\s*5/);
  // The prop must be destructured with that default
  assert.match(source, /maxSizeMB\s*=\s*DEFAULT_MAX_SIZE_MB/);
  // The prop variable must be forwarded to the hook (not a literal)
  assert.match(source, /maxSizeMB,/);
  // The hook must honour the maxSizeMB option
  assert.match(hookSource, /maxSizeMB/);
  assert.match(hookSource, /file\.size > maxBytes/);
  assert.doesNotMatch(source, /fetch\(/);
});

test('Login rejects oversized files via the shared hook using the prop default (5 MB)', () => {
  // Default is 5 MB — verify the constant
  assert.match(source, /DEFAULT_MAX_SIZE_MB\s*=\s*5/);
  // Hook converts MB to bytes and checks size
  assert.match(hookSource, /maxSizeMB/);
  assert.match(hookSource, /file\.size > maxBytes/);
  // Callers can override: the prop must NOT be a bare literal 5 in the hook call
  // Previously this was hardcoded as `maxSizeMB: 5`, which ignored the prop.
  assert.doesNotMatch(source, /maxSizeMB:\s*5[^0-9]/);
});

test('Login upload guards empty and in-flight submissions via the hook', () => {
  assert.match(source, /disabled=\{!file \|\| isUploading\}/);
  assert.match(hookSource, /uploadInFlightRef/);
  assert.match(
    hookSource,
    /if \(uploadInFlightRef\.current\) \{[\s\S]*?return;[\s\S]*?uploadInFlightRef\.current = true;/,
  );
  assert.match(hookSource, /finally \{[\s\S]*uploadInFlightRef\.current = false;/);
});

test('Login upload uses a configurable endpoint via the shared hook', () => {
  assert.match(source, /uploadUrl\?: string/);
  assert.match(source, /uploadUrl = getDefaultUploadUrl\(\)/);
  assert.match(source, /SENDLY_UPLOAD_URL/);
  assert.match(hookSource, /if \(!uploadUrl\)/);
  assert.match(hookSource, /Upload URL is not configured\./);
  assert.doesNotMatch(source, /https:\/\/example\.com/);
  assert.doesNotMatch(source, /\bfetch\s*\(/);
});

test('Login aborts uploads on unmount without reporting AbortError (via shared hook)', () => {
  // AbortController lifecycle is owned by the hook, not Login.tsx directly
  assert.match(hookSource, /new AbortController\(\)/);
  assert.match(hookSource, /signal: controller\.signal/);
  assert.match(hookSource, /return \(\) => \{[\s\S]*abortControllerRef\.current\?\.abort\(\)/);
  assert.match(hookSource, /uploadError\.name === 'AbortError'[\s\S]*return/);
  assert.match(hookSource, /if \(isMountedRef\.current\)[\s\S]*setIsUploading\(false\)/);
});
