# Sendly-Test-Repo

Webhook integration repo for GitHub agent bounty workflows (Sendly).

## Repository metadata

- **Owner:** Hazyshades
- **Full name:** Hazyshades/Sendly-Test-Repo
- **Repo ID:** 1287958084

## Bounty cases

| Case | Description | Reward |
|------|-------------|--------|
| **A** | Issue bounty escrow | Test USDC on ARC Testnet |
| **B** | Review-to-earn | Test USDC on ARC Testnet |

## Development

### Prerequisites & Installation

Node.js version is pinned to `20.19.5` in `.nvmrc`. Install dependencies via:

```bash
npm ci   # reproducible install from the committed package-lock.json
npm run typecheck
npm test
```

Runs both the JavaScript test runner across all test suites (`npm run test:js` via `node --test`) and the Python test suite (`npm run test:py` via `python3 -m unittest test_fix -v`), returning a non-zero exit code if any test fails to ensure CI and local runs fail immediately on test failures.

### Test Suites

#### JavaScript / Node.js Suites (run via `npm run test:js`)

`npm run test:js` executes `node --test`, which automatically discovers and executes all test suites matching `**/*.test.js`:

- `components/file_upload.test.js`
- `double_submit_race.test.js`
- `file_upload_component.test.js`
- `login_upload.test.js`
- `test_suite_wiring.test.js`
- `upload_file.test.js`
- `use_file_upload_errors.test.js`

#### Python CLI Suite
Runs the Python test suite (`test_fix.py`):

```bash
npm run test:py
```
or:
```bash
python3 -m unittest test_fix.py
```

or equivalently:

```bash
python test_fix.py
```

## Contributing

1. Comment `/attempt #NN` on the bounty issue before starting work.
2. Fork the repository and open a PR that references the issue (`Fixes #NN`).
3. After the PR is reviewed and merged, comment your ARC Testnet EVM address on
   the issue. The bounty is paid in test USDC on ARC Testnet.

### Running Tests
To run the JavaScript test suite:
`npm test`

To run the Python test suite:
`python3 -m unittest test_fix -v`
