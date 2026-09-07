const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const test = require('node:test');

const source = readFileSync('Login.tsx', 'utf8');
const hookSource = readFileSync('lib/useFileUpload.ts', 'utf8');

test('Login upload sends binary data as multipart FormData via useFileUpload hook', () => {
  assert.match(hookSource, /new\s+FormData\s*\(/);
  assert.match(hookSource, /\.append\(\s*(?:fieldName|['"]file['"]),\s*(?:f|file),\s*(?:f|file)\.name\s*\)/);
  assert.doesNotMatch(hookSource, /JSON\.stringify/);
  assert.doesNotMatch(hookSource, /Content-Type['"]?\s*:\s*['"]application\/json/);
});

test('Login delegates file selection to the shared hook', () => {
  assert.doesNotMatch(source, /useState/);
  assert.doesNotMatch(source, /\bfetch\s*\(/);
  assert.match(hookSource, /selectedFiles\[0\]/);
  assert.match(source, /handleFileChange/);
});

test('Login rejects oversized files via the shared hook maxSizeMB option', () => {
  assert.match(source, /maxSizeMB/);
  assert.match(hookSource, /maxSizeMB/);
  assert.match(hookSource, /f\.size > maxBytes|file\.size > maxBytes/);
  assert.doesNotMatch(source, /fetch\(/);
});

test('Login prop flows through to the hook with documented default and enforces oversized rejection', () => {
  // Prop is declared on props interface with documented default
  assert.match(source, /maxSizeMB\?:\s*number/);
  assert.match(source, /maxSizeMB\s*=\s*5/);
  // Prop is passed into useFileUpload without hardcoding
  assert.match(source, /useFileUpload\(\{[\s\S]*?\bmaxSizeMB\b/);
  assert.doesNotMatch(source, /useFileUpload\(\{[\s\S]*?\bmaxSizeMB:\s*5/);

  // Hook enforces maximum size calculation and rejection
  assert.match(hookSource, /const maxBytes = maxSizeMB \* 1024 \* 1024/);
  assert.match(hookSource, /f\.size > maxBytes|file\.size > maxBytes/);
});

test('Login upload guards empty and in-flight submissions via the hook', () => {
  assert.match(source, /disabled=\{!file \|\| isUploading \|\| uploadingRef\.current\}/);
  assert.match(hookSource, /uploadingRef/);
  assert.match(
    hookSource,
    /if \(uploadingRef\.current[\s\S]*?\) \{[\s\S]*?return;[\s\S]*?uploadingRef\.current = true;/,
  );
  assert.match(hookSource, /finally \{[\s\S]*uploadingRef\.current = false;/);
});

test('Login file input is enabled on fresh mount and only disabled during upload', () => {
  assert.match(source, /<input[\s\S]*?disabled=\{isUploading\}/);
});

test('Login only describes status and error nodes that are currently rendered', () => {
  assert.match(source, /<p id="login-upload-status" role="status">/);
  assert.match(source, /<p id="login-upload-error" role="alert">/);
  assert.match(
    source,
    /aria-describedby=\{[\s\S]*?error[\s\S]*?"login-upload-error"[\s\S]*?message[\s\S]*?"login-upload-status"[\s\S]*?: undefined[\s\S]*?\}/,
  );
  assert.doesNotMatch(source, /aria-describedby="login-upload-status login-upload-error"/);
  assert.match(source, /<label htmlFor="login-file-input">/);
  assert.match(source, /<input[\s\S]*?id="login-file-input"/);
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
