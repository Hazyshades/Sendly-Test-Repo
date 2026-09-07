const assert = require('node:assert/strict');
const { readFileSync, readdirSync, statSync } = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const collectTestFiles = (directory) => {
  const entries = readdirSync(directory);
  const files = [];

  for (const entry of entries) {
    if (entry === 'node_modules') {
      continue;
    }

    const fullPath = path.join(directory, entry);
    const stats = statSync(fullPath);

    if (stats.isDirectory()) {
      files.push(...collectTestFiles(fullPath));
      continue;
    }

    if (entry.endsWith('.test.js')) {
      files.push(fullPath);
    }
  }

  return files;
};

test('package.json wires JS and Python suites into npm test', () => {
  const pkg = JSON.parse(readFileSync('package.json', 'utf8'));

  assert.match(pkg.scripts.test, /test:js/);
  assert.match(pkg.scripts.test, /test:py/);
  assert.equal(pkg.scripts['test:js'], 'node --test');
  assert.match(pkg.scripts['test:py'], /unittest test_fix/);
});

test('repo contains the previously omitted JS and Python suites', () => {
  const discovered = collectTestFiles(process.cwd()).map((filePath) =>
    path.relative(process.cwd(), filePath).replaceAll('\\', '/'),
  );

  assert.ok(discovered.includes('double_submit_race.test.js'));
  assert.ok(discovered.includes('components/file_upload.test.js'));
  assert.ok(discovered.includes('login_upload.test.js'));
  assert.ok(discovered.includes('upload_file.test.js'));
  assert.ok(discovered.includes('file_upload_component.test.js'));
  assert.ok(discovered.includes('test_suite_wiring.test.js'));
});

test('test:py does not chain commands via fallback || operator', () => {
  const pkg = JSON.parse(readFileSync('package.json', 'utf8'));

  assert.ok(!pkg.scripts['test:py'].includes('||'));
});

test('run_test_py launcher exits non-zero on test failures without re-running', () => {
  const { spawnSync } = require('node:child_process');
  const result = spawnSync(process.execPath, ['run_test_py.js', '-m', 'unittest', 'nonexistent_test_module'], {
    encoding: 'utf8',
  });

  assert.notEqual(result.status, 0);
  const errorCount = (result.stderr.match(/ModuleNotFoundError/g) || []).length;
  assert.equal(errorCount, 1);
});

test('run_test_py launcher provides a clear diagnostic error when interpreter is missing', () => {
  const { spawnSync } = require('node:child_process');
  const result = spawnSync(process.execPath, ['run_test_py.js'], {
    env: { ...process.env, PATH: '' },
    encoding: 'utf8',
  });

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /Error: Python interpreter not found/);
});
