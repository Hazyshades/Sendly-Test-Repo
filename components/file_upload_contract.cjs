const assert = require('node:assert/strict');

function assertValidationContract(source) {
  // The validation loop must iterate over `files` using either `f` or `file` as the variable name
  const validationLoops =
    source.match(/for\s*\(\s*const f(?:ile)?\s+of\s+files\s*\)/g) || [];

  assert.ok(
    validationLoops.length >= 1,
    'expected at least one "for (const f[ile] of files)" validation loop',
  );

  // Must declare a validFiles accumulator
  assert.match(source, /const validFiles: File\[\] = \[\]/);

  // Must use invalidFileNames (not a generic errors[]) for rejected files
  assert.match(source, /const invalidFileNames: string\[\] = \[\]/);

  // Size check against computed maxBytes (no null guard — maxSizeMB always has a default)
  assert.match(source, /f(?:ile)?\.size > maxBytes/);

  // Valid files are collected and propagated
  assert.match(source, /validFiles\.push\(f(?:ile)?\)/);
  assert.match(source, /validFiles\.length === 0/);

  // Selection is cleared via clearSelection(), not the old resetSelection()
  assert.match(source, /clearSelection\(\)/);
  assert.doesNotMatch(source, /resetSelection\(\)/);

  // Callback receives the filtered list
  assert.match(source, /onFilesSelected\?\.\(validFiles\)/);
  assert.doesNotMatch(source, /onFilesSelected\?\.\(files\)/);

  // Must NOT use the legacy errors[] pattern
  assert.doesNotMatch(source, /const errors: string\[\] = \[\]/);
}

module.exports = { assertValidationContract };
