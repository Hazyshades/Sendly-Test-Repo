const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const test = require('node:test');
const { assertValidationContract } = require('./components/file_upload_contract.cjs');

const source = readFileSync('components/FileUpload.tsx', 'utf8');
const hookSource = readFileSync('lib/useFileUpload.ts', 'utf8');

test('FileUpload does not duplicate preview creation and revocation', () => {
  assert.doesNotMatch(source, /URL\.createObjectURL/);
  assert.doesNotMatch(source, /URL\.revokeObjectURL/);
});

test('preview creation and revocation are owned by the shared hook', () => {
  assert.match(hookSource, /URL\.createObjectURL\(file\)/);
  assert.match(hookSource, /URL\.revokeObjectURL\(url\)/);
});

test('validation contract is enforced against the hook that owns selection', () => {
  assertValidationContract(hookSource);
});

test('useFileUpload keeps image preview URL cleanup', () => {
  assert.match(hookSource, /URL\.createObjectURL\(/);
  assert.match(hookSource, /URL\.revokeObjectURL\(/);
});

test('FileUpload binds preview URLs to individual files and avoids index mismatch', () => {
  assert.doesNotMatch(source, /previews\[index\]/);
  assert.match(source, /previews\.get\(/);
});

test('useFileUpload revokes previous preview URLs before replacing selection or committing', () => {
  assert.match(
    hookSource,
    /commitSelection[\s\S]*?previewsRef\.current\.forEach\(\(url\) => \{[\s\S]*?URL\.revokeObjectURL\(url\)[\s\S]*?setPreviews\(newPreviews\)/,
  );
  assert.match(
    hookSource,
    /selectFiles[\s\S]*?previewsRef\.current\.forEach\(\(url\) => \{[\s\S]*?URL\.revokeObjectURL\(url\)[\s\S]*?setPreviews\(newPreviews\)/,
  );
});

test('clearSelection and unmount safely clean up preview URLs without double-revoking', () => {
  assert.match(
    hookSource,
    /clearSelection[\s\S]*?setPreviews\(\(prev\) => \{[\s\S]*?URL\.revokeObjectURL\(url\)[\s\S]*?previewsRef\.current = \[\]/,
  );
  assert.match(
    hookSource,
    /return \(\) => \{[\s\S]*?previewsRef\.current\.forEach\(\(url\) => \{[\s\S]*?URL\.revokeObjectURL\(url\)[\s\S]*?previewsRef\.current = \[\]/,
  );
});

test('useFileUpload types previews as Map<File, string> and avoids index-coupled string array', () => {
  assert.match(hookSource, /previews:\s*Map<File,\s*string>/);
  assert.doesNotMatch(hookSource, /previews:\s*string\[\]/);
  assert.doesNotMatch(hookSource, /useState<string\[\]>\(\[\]\)/);
});

test('FileUpload consumes previews Map directly without index mapping', () => {
  assert.match(source, /previews,\s*\n\s*handleFileChange/);
  assert.doesNotMatch(source, /hookPreviews/);
});
