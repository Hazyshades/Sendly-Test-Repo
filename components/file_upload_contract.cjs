const assert = require('node:assert/strict');

function assertValidationContract(source) {
  const validationLoops = source.match(/for\s*\(\s*const file of files\s*\)/g) || [];

  assert.equal(validationLoops.length, 1);
  assert.match(source, /maxSizeMB \* 1024 \* 1024/);
  assert.match(source, /const validFiles: File\[\] = \[\]/);
  assert.match(source, /const invalidFileNames: string\[\] = \[\]/);
  assert.match(source, /file\.size > maxBytes/);
  assert.match(source, /validFiles\.push\(file\)/);
  assert.match(source, /validFiles\.length === 0/);
  assert.match(source, /clearSelection\(\)/);
  assert.match(source, /onFilesSelected\?\.\(validFiles\)/);
  assert.doesNotMatch(source, /onFilesSelected\?\.\(files\)/);
}

module.exports = { assertValidationContract };
