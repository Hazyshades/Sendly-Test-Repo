const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const test = require('node:test');
const { assertValidationContract } = require('./file_upload_contract.cjs');

const source = readFileSync('components/FileUpload.tsx', 'utf8');
const hookSource = readFileSync('lib/useFileUpload.ts', 'utf8');

test('FileUpload delegates validation to useFileUpload', () => {
  assert.match(source, /useFileUpload\s*\(/);
  assert.doesNotMatch(source, /\bfetch\s*\(/);
  assert.doesNotMatch(source, /new\s+FormData\s*\(/);
  assert.doesNotMatch(source, /useState/);
  assertValidationContract(hookSource);
});

test('FileUpload uploads with multipart FormData via the shared hook', () => {
  assert.match(hookSource, /new\s+FormData\s*\(/);
  assert.match(hookSource, /\.append\(fieldName, file, file\.name\)/);
  assert.doesNotMatch(hookSource, /JSON\.stringify/);
  assert.doesNotMatch(hookSource, /Content-Type['"]?\s*:\s*['"]application\/json/);
});

test('FileUpload guards empty uploads and in-flight submissions via the hook', () => {
  assert.match(source, /disabled=\{isUploading \|\| uploadingRef\.current\}/);
  assert.match(hookSource, /if\s*\(\s*selectedFiles\.length === 0\s*\)/);
  assert.match(hookSource, /const uploadingRef = useRef\(false\)/);
  assert.match(
    hookSource,
    /if \(uploadingRef\.current\) \{[\s\S]*?return;[\s\S]*?uploadingRef\.current = true;/,
  );
  assert.match(hookSource, /finally \{[\s\S]*uploadingRef\.current = false;/);
});

test('FileUpload has valid a11y attributes without duplicate id or aria-describedby', () => {
  assert.match(source, /<label\s+htmlFor="file-upload-input"/);
  assert.doesNotMatch(source, /id=\{inputId\}/);
  assert.doesNotMatch(source, /aria-describedby=\{describedBy\}/);

  const inputMatches = source.match(/<input[\s\S]*?\/>/);
  assert.ok(inputMatches, 'input element should exist');
  const inputTag = inputMatches[0];

  const idMatches = inputTag.match(/\bid=/g) || [];
  assert.equal(idMatches.length, 1, 'input should have exactly one id attribute');

  const ariaDescribedByMatches = inputTag.match(/\baria-describedby=/g) || [];
  assert.equal(ariaDescribedByMatches.length, 1, 'input should have exactly one aria-describedby attribute');

  assert.match(source, /<p\s+id="file-upload-error"\s+role="alert"/);
  assert.match(source, /<p\s+id="file-upload-status"\s+role="status"/);
});
