const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const test = require('node:test');

const source = readFileSync('Login.tsx', 'utf8');
const hookSource = readFileSync('lib/useFileUpload.ts', 'utf8');

test('Login upload sends binary data as multipart FormData', () => {
  assert.match(source, /useFileUpload\s*\(/);
  assert.match(hookSource, /new\s+FormData\s*\(/);
  assert.match(hookSource, /\.append\(\s*['"]file['"],\s*file,\s*file\.name\s*\)/);
  assert.doesNotMatch(hookSource, /JSON\.stringify/);
  assert.doesNotMatch(hookSource, /Content-Type['"]?\s*:\s*['"]application\/json/);
});

test('Login delegates file selection to the shared hook', () => {
  assert.doesNotMatch(source, /useState/);
  assert.doesNotMatch(source, /\bfetch\s*\(/);
  assert.match(hookSource, /file = selectedFiles\[0\] \?\? null/);
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
  assert.doesNotMatch(source, /maxSizeMB:\s*5[^0-9]/);
});

test('Login upload guards empty and in-flight submissions via the hook', () => {
  // Login uses !file || isUploading for the disabled state
  assert.match(source, /disabled=\{!file \|\| isUploading\}/);
  // The hook owns the uploadingRef guard internally
  assert.match(hookSource, /uploadingRef/);
  assert.match(
    hookSource,
    /if \(uploadingRef\.current\) \{[\s\S]*?return;[\s\S]*?uploadingRef\.current = true;/,
  );
  assert.match(hookSource, /finally \{[\s\S]*uploadingRef\.current = false;/);
});

test('Login upload uses a configurable endpoint via the shared hook', () => {
  assert.match(source, /uploadUrl\?\s*:\s*string/);
  assert.match(source, /uploadUrl = getDefaultUploadUrl\(\)/);
  assert.match(source, /SENDLY_UPLOAD_URL/);
  assert.match(hookSource, /uploadUrl/);
  assert.doesNotMatch(source, /https:\/\/example\.com/);
});

test('Login has exactly one IncorrectUpload export', () => {
  const exportMatches = source.match(/export\s+const\s+IncorrectUpload/g) || [];
  assert.equal(exportMatches.length, 1, 'should have exactly one IncorrectUpload export');
});

test('Login has no undefined symbols', () => {
  assert.doesNotMatch(source, /LoginUploadProps/);
  assert.doesNotMatch(source, /endpoint/);
  assert.doesNotMatch(source, /uploadFiles/);
  assert.doesNotMatch(source, /statusMessage/);
});
