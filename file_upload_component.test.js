const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const test = require('node:test');

const source = readFileSync('components/FileUpload.tsx', 'utf8');
const hookSource = readFileSync('lib/useFileUpload.ts', 'utf8');

test('FileUpload keeps image preview URL cleanup', () => {
  assert.match(source, /URL\.createObjectURL\(file\)/);
  assert.match(source, /URL\.revokeObjectURL\(url\)/);
  assertValidationContract(source);
});

test('preview creation and revocation are owned by the shared hook', () => {
  assert.match(hookSource, /URL\.createObjectURL\(file\)/);
  assert.match(hookSource, /URL\.revokeObjectURL\(url\)/);
});

test('validation contract is enforced against the hook that owns selection', () => {
  assertValidationContract(hookSource);
  assertValidationContract(source);
});
