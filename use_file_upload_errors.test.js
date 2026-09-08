const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const { existsSync, readFileSync } = require('node:fs');
const test = require('node:test');

execFileSync(
  process.execPath,
  [
    './node_modules/typescript/bin/tsc',
    'lib/mapUploadError.ts',
    '--target',
    'ES2022',
    '--module',
    'commonjs',
    '--outDir',
    '.test-build',
    '--skipLibCheck',
  ],
  { stdio: 'inherit' },
);

const {
  UploadHttpError,
  getFriendlyUploadErrorMessage,
  isNetworkError,
} = require('./.test-build/mapUploadError.js');

test('UploadHttpError stores status and maintains proper name and message', () => {
  const err = new UploadHttpError(404);
  assert.equal(err.status, 404);
  assert.equal(err.name, 'UploadHttpError');
  assert.equal(err.message, 'Upload failed with status 404');
  assert.ok(err instanceof Error);
});

test('maps 4xx HTTP client errors to a friendly message without leaking status code', () => {
  const statuses = [400, 401, 403, 404, 409, 413, 422, 429];
  for (const status of statuses) {
    const message = getFriendlyUploadErrorMessage(new UploadHttpError(status));
    assert.equal(message, 'Upload failed. Please check your file and try again.');
    assert.doesNotMatch(message, new RegExp(String(status)));
  }
});

test('maps 5xx HTTP server errors to a friendly service message without leaking status code', () => {
  const statuses = [500, 502, 503, 504];
  for (const status of statuses) {
    const message = getFriendlyUploadErrorMessage(new UploadHttpError(status));
    assert.equal(
      message,
      'Upload service is temporarily unavailable. Please try again later.',
    );
    assert.doesNotMatch(message, new RegExp(String(status)));
  }
});

test('maps network and offline fetch failures to a friendly connection message', () => {
  const typeError1 = new TypeError('Failed to fetch');
  assert.equal(
    getFriendlyUploadErrorMessage(typeError1),
    'Network error. Please check your connection and try again.',
  );

  const typeError2 = new TypeError('fetch failed');
  assert.equal(
    getFriendlyUploadErrorMessage(typeError2),
    'Network error. Please check your connection and try again.',
  );

  const typeError3 = new TypeError('Load failed');
  assert.equal(
    getFriendlyUploadErrorMessage(typeError3),
    'Network error. Please check your connection and try again.',
  );

  const networkError = new Error('NetworkError when attempting to fetch resource.');
  assert.equal(
    getFriendlyUploadErrorMessage(networkError),
    'Network error. Please check your connection and try again.',
  );

  const reactNativeNetworkError = new Error('Network request failed');
  assert.equal(
    getFriendlyUploadErrorMessage(reactNativeNetworkError),
    'Network error. Please check your connection and try again.',
  );

  const offlineError = new Error('Client is offline');
  assert.equal(
    getFriendlyUploadErrorMessage(offlineError),
    'Network error. Please check your connection and try again.',
  );

  const chromiumOfflineError = new Error('net::ERR_INTERNET_DISCONNECTED');
  assert.equal(
    getFriendlyUploadErrorMessage(chromiumOfflineError),
    'Network error. Please check your connection and try again.',
  );
});

test('maps unknown or generic errors to a safe fallback message', () => {
  const unknownError = new Error('Unexpected token < in JSON');
  assert.equal(
    getFriendlyUploadErrorMessage(unknownError),
    'Upload failed. Please try again.',
  );

  const syntaxError = new SyntaxError('Unexpected token < in JSON');
  assert.equal(
    getFriendlyUploadErrorMessage(syntaxError),
    'Upload failed. Please try again.',
  );

  const typeErrorNotNetwork = new TypeError('Unexpected token < in JSON');
  assert.equal(
    getFriendlyUploadErrorMessage(typeErrorNotNetwork),
    'Upload failed. Please try again.',
  );

  const genericTypeError = new TypeError('Cannot read properties of undefined');
  assert.equal(
    getFriendlyUploadErrorMessage(genericTypeError),
    'Upload failed. Please try again.',
  );

  assert.equal(
    getFriendlyUploadErrorMessage(null),
    'Upload failed. Please try again.',
  );

  assert.equal(
    getFriendlyUploadErrorMessage('some string error'),
    'Upload failed. Please try again.',
  );
});

test('useFileUpload source adheres to error handling contract', () => {
  const hookSource = readFileSync('lib/useFileUpload.ts', 'utf8');

  // Throws UploadHttpError rather than raw Error
  assert.match(hookSource, /throw new UploadHttpError\(response\.status\)/);

  // Maps upload error before setting state
  assert.match(hookSource, /const uploadErrorMessage = getFriendlyUploadErrorMessage\(uploadError\)/);
  assert.match(hookSource, /setError\(uploadErrorMessage\)/);
  assert.match(hookSource, /onUploadError\?\.\(uploadErrorMessage\)/);

  // Does not leak raw message directly
  assert.doesNotMatch(hookSource, /setError\(uploadError\.message\)/);

  // Silences AbortError
  assert.match(hookSource, /uploadError\.name === 'AbortError'/);

  // Preserves full technical error in console.error
  assert.match(hookSource, /console\.error\('Upload error:', uploadError\)/);
});

test('mapUploadError.ts is the single runtime source and avoids broad TypeError fallback', () => {
  const tsSource = readFileSync('lib/mapUploadError.ts', 'utf8');
  assert.equal(existsSync('lib/mapUploadError.cjs'), false);
  assert.equal(existsSync('lib/mapUploadError.d.cts'), false);
  assert.equal(existsSync('lib/mapUploadError.d.ts'), false);
  assert.doesNotMatch(tsSource, /mapUploadError\.cjs/);
  assert.doesNotMatch(tsSource, /error\s+instanceof\s+TypeError/);
  assert.doesNotMatch(tsSource, /message\.includes\(['"]network['"]\)/);
  assert.match(tsSource, /export function isNetworkError/);
  assert.match(tsSource, /export function getFriendlyUploadErrorMessage/);
  assert.match(tsSource, /export class UploadHttpError/);
});

test('isNetworkError helper accurately identifies network failures and rejects generic parse errors', () => {
  assert.equal(typeof isNetworkError, 'function');
  assert.equal(isNetworkError(new TypeError('Failed to fetch')), true);
  assert.equal(isNetworkError(new TypeError('fetch failed')), true);
  assert.equal(isNetworkError(new TypeError('Load failed')), true);
  assert.equal(isNetworkError(new Error('NetworkError when attempting to fetch resource.')), true);
  assert.equal(isNetworkError(new Error('Network request failed')), true);
  assert.equal(isNetworkError(new Error('Client is offline')), true);
  assert.equal(isNetworkError(new Error('net::ERR_INTERNET_DISCONNECTED')), true);

  assert.equal(isNetworkError(new TypeError('Unexpected token < in JSON')), false);
  assert.equal(isNetworkError(new SyntaxError('Unexpected token < in JSON')), false);
  assert.equal(isNetworkError(new TypeError('Cannot read properties of undefined')), false);
  assert.equal(isNetworkError(new Error('Some other error')), false);
  assert.equal(isNetworkError(null), false);
  assert.equal(isNetworkError(undefined), false);
});

test('useFileUpload does not import or re-export unused isNetworkError helper', () => {
  const hookSource = readFileSync('lib/useFileUpload.ts', 'utf8');
  assert.doesNotMatch(hookSource, /\bisNetworkError\b/);
});

