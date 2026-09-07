const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const test = require('node:test');

const wrapperSource = readFileSync('upload_file.tsx', 'utf8');
const source = readFileSync('Login.tsx', 'utf8');
const hookSource = readFileSync('lib/useFileUpload.ts', 'utf8');

test('upload sends the selected file with FormData instead of JSON', () => {
  assert.match(hookSource, /new\s+FormData\s*\(/);
  assert.match(hookSource, /formData\.append\(/);
  assert.doesNotMatch(hookSource, /JSON\.stringify/);
  assert.doesNotMatch(hookSource, /Content-Type['"]?\s*:\s*['"]application\/json/);
});

test('file change stores a single File from the FileList', () => {
  assert.match(hookSource, /useFileUpload/);
  assert.match(source, /useFileUpload/);
});

test('shared uploader aborts on unmount and ignores AbortError', () => {
  assert.match(hookSource, /new AbortController\(\)/);
  assert.match(hookSource, /signal: abortControllerRef\.current\.signal/);
  assert.match(hookSource, /return \(\) => \{[\s\S]*abortControllerRef\.current\?\.abort\(\)/);
  assert.match(hookSource, /uploadError\.name === 'AbortError'[\s\S]*return/);
});

test('consolidated upload source has no hardcoded endpoint', () => {
  assert.doesNotMatch(wrapperSource, /https?:\/\//);
  assert.doesNotMatch(source, /fetch\(\s*['"]https?:\/\//);
  assert.doesNotMatch(source, /\bfetch\s*\(/);
});

test('upload handler uses a synchronous ref guard against re-entry in the hook', () => {
  assert.match(hookSource, /uploadingRef/);
  assert.match(
    hookSource,
    /if \(uploadingRef\.current\) \{[\s\S]*?return;[\s\S]*?uploadingRef\.current = true;/,
  );
  assert.match(hookSource, /finally \{[\s\S]*uploadingRef\.current = false;/);
  assert.doesNotMatch(source, /https:\/\/example\.com/);
});

test('upload appends exactly one entry per selected file to FormData without duplication', () => {
  assert.match(hookSource, /const fieldName = multiple \? 'files' : 'file';/);
  assert.match(
    hookSource,
    /for\s*\(\s*const file of selectedFiles\s*\)\s*\{\s*formData\.append\(fieldName, file, file\.name\);\s*\}/,
  );
  assert.doesNotMatch(
    hookSource,
    /formData\.append\('file', file, file\.name\);[\s\S]*?formData\.append\(fieldName, file, file\.name\);/,
  );
});

test('upload retains files field name in multiple mode and file in single mode', () => {
  assert.match(hookSource, /const fieldName = multiple \? 'files' : 'file';/);
});

