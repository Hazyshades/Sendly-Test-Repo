const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const test = require('node:test');
const ts = require('typescript');

const hookSource = readFileSync('lib/useFileUpload.ts', 'utf8');
const functionSource = hookSource.match(
  /export function isAcceptedFile[\s\S]*?\n}\r?\n\r?\n\/\*\*/
);
assert.ok(functionSource, 'isAcceptedFile must remain a single exported implementation');
const compiled = ts.transpileModule(functionSource[0].replace(/\r?\n\/\*\*$/, ''), {
  compilerOptions: { module: ts.ModuleKind.CommonJS },
}).outputText;
const moduleUnderTest = { exports: {} };
new Function('exports', 'module', compiled)(
  moduleUnderTest.exports,
  moduleUnderTest
);
const { isAcceptedFile } = moduleUnderTest.exports;

const file = (name, type) => ({ name, type });

test('allows all files when accept is omitted or empty', () => {
  assert.equal(isAcceptedFile(file('notes.txt', 'text/plain')), true);
  assert.equal(isAcceptedFile(file('notes.txt', 'text/plain'), ' , '), true);
  assert.equal(isAcceptedFile(file('notes.txt', 'text/plain'), '*/*'), true);
});

test('matches extensions case-insensitively', () => {
  assert.equal(isAcceptedFile(file('PHOTO.PNG', ''), '.png'), true);
  assert.equal(isAcceptedFile(file('photo.jpg', 'image/jpeg'), '.png'), false);
});

test('matches exact and wildcard MIME types', () => {
  assert.equal(isAcceptedFile(file('photo.bin', 'IMAGE/PNG'), 'image/png'), true);
  assert.equal(isAcceptedFile(file('photo.png', 'image/png'), 'image/*'), true);
  assert.equal(isAcceptedFile(file('notes.txt', 'text/plain'), 'image/*'), false);
});

test('supports comma-separated filters without broad prefix matches', () => {
  assert.equal(
    isAcceptedFile(file('report.pdf', 'application/pdf'), '.png, application/pdf'),
    true
  );
  assert.equal(isAcceptedFile(file('data.json', 'application/json'), 'application'), false);
});
