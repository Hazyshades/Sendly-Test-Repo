const assert = require('node:assert/strict');

function assertValidationContract(source) {
  const validationLoops = source.match(/for\s*\(\s*const (?:file|f) of files\s*\)/g) || [];

  assert.equal(validationLoops.length, 1);
  assert.match(source, /const maxBytes = maxSizeMB \* 1024 \* 1024/);
  assert.match(source, /const validFiles: File\[\] = \[\]/);
  assert.match(source, /const invalidFileNames: string\[\] = \[\]/);
  assert.match(source, /if \((?:file|f)\.size > maxBytes\)/);
  assert.match(source, /invalidFileNames\.push\((?:file|f)\.name\)/);
  assert.match(source, /validFiles\.push\((?:file|f)\)/);
  assert.match(source, /validFiles\.length === 0/);
  assert.match(source, /clearSelection\(\)/);
  assert.match(source, /onFilesSelected\?\.\(validFiles\)/);
  assert.doesNotMatch(source, /const errors: string\[\] = \[\]/);
  assert.doesNotMatch(source, /onFilesSelected\?\.\(files\)/);

  // Must NOT use the legacy errors[] pattern
  assert.doesNotMatch(source, /const errors: string\[\] = \[\]/);
}

module.exports = { assertValidationContract };
