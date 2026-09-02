const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const test = require('node:test');
const { assertValidationContract } = require('./components/file_upload_contract.cjs');

const hookSource = readFileSync('lib/useFileUpload.ts', 'utf8');

test('FileUpload keeps image preview URL cleanup', () => {
  assert.match(source, /URL\.createObjectURL\(file\)/);
  assert.match(source, /URL\.revokeObjectURL\(url\)/);
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
