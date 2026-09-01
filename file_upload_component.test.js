const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const test = require('node:test');

const source = readFileSync('components/FileUpload.tsx', 'utf8');
const hookSource = readFileSync('lib/useFileUpload.ts', 'utf8');

test('FileUpload delegates preview URL cleanup to the shared hook', () => {
  assert.doesNotMatch(source, /URL\.createObjectURL\(file\)/);
  assert.doesNotMatch(source, /URL\.revokeObjectURL\(url\)/);
  assert.match(hookSource, /URL\.createObjectURL\(file\)/);
  assert.match(hookSource, /URL\.revokeObjectURL\(url\)/);
});

test('FileUpload is a thin UI wrapper without upload logic', () => {
  assert.match(source, /useFileUpload\s*\(/);
  assert.doesNotMatch(source, /new\s+FormData\s*\(/);
  assert.doesNotMatch(source, /\bfetch\s*\(/);
  assert.doesNotMatch(source, /useState/);
  assert.doesNotMatch(source, /useEffect/);
});
