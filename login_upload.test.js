const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const test = require('node:test');

const source = readFileSync('Login.tsx', 'utf8');
const hookSource = readFileSync('lib/useFileUpload.ts', 'utf8');

test('Login upload sends binary data as multipart FormData', () => {
  assert.match(source, /new\s+FormData\s*\(/);
  assert.match(source, /\.append\(\s*['"]file['"],\s*file,\s*file\.name\s*\)/);
  assert.doesNotMatch(source, /JSON\.stringify/);
  assert.doesNotMatch(source, /Content-Type['"]?\s*:\s*['"]application\/json/);
});

test('Login delegates file selection to the shared hook', () => {
  assert.doesNotMatch(source, /useState/);
  assert.doesNotMatch(source, /\bfetch\s*\(/);
  assert.match(hookSource, /file: selectedFiles\[0\] \?\? null/);
  assert.match(source, /handleFileChange/);
});

test('Login rejects oversized files via the shared hook maxSizeMB option', () => {
  assert.match(source, /maxSizeMB:\s*5/);
  assert.match(hookSource, /maxSizeMB/);
  assert.match(hookSource, /file\.size > maxBytes/);
  assert.doesNotMatch(source, /fetch\(/);
});

test('Login upload guards empty and in-flight submissions via the hook', () => {
  assert.match(source, /disabled=\{!file \|\| isUploading \|\| uploadingRef\.current\}/);
  assert.match(hookSource, /uploadingRef/);
  assert.match(
    hookSource,
    /if \(uploadingRef\.current\) \{[\s\S]*?return;[\s\S]*?uploadingRef\.current = true;/,
  );
  assert.match(hookSource, /finally \{[\s\S]*uploadingRef\.current = false;/);
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
