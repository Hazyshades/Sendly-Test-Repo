const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const test = require('node:test');
const { assertValidationContract } = require('./components/file_upload_contract.cjs');

const hookSource = readFileSync('lib/useFileUpload.ts', 'utf8');

test('useFileUpload follows the shared file validation contract', () => {
  assertValidationContract(hookSource);
});

test('useFileUpload keeps image preview URL cleanup', () => {
  assert.match(hookSource, /URL\.createObjectURL\(/);
  assert.match(hookSource, /URL\.revokeObjectURL\(/);
});
