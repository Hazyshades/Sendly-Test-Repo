const { spawnSync } = require('node:child_process');

/**
 * Detects an available Python 3 interpreter in PATH.
 *
 * @returns {string | null} The command name of the detected Python binary, or null if none found.
 */
function resolvePythonBinary() {
  const candidates = ['python3', 'python'];
  for (const candidate of candidates) {
    const probe = spawnSync(candidate, ['--version'], { stdio: 'ignore' });
    if (probe.status === 0) {
      return candidate;
    }
  }
  return null;
}

/**
 * Executes the Python test suite with the resolved interpreter and propagates its exit code.
 */
function run() {
  const pythonBin = resolvePythonBinary();
  if (!pythonBin) {
    process.stderr.write('Error: Python interpreter not found (neither python3 nor python is available in PATH).\n');
    process.exit(1);
  }

  const userArgs = process.argv.slice(2);
  const testArgs = userArgs.length > 0 ? userArgs : ['-m', 'unittest', 'test_fix.py'];
  const execution = spawnSync(pythonBin, testArgs, { stdio: 'inherit' });

  if (execution.error) {
    process.stderr.write(`Error launching Python test suite: ${execution.error.message}\n`);
    process.exit(1);
  }

  process.exit(execution.status ?? 1);
}

run();
