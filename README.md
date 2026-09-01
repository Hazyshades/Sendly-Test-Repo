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

Node.js version is pinned to `20.19.5` (defined in `.nvmrc`).

To set up the repository and run all checks locally, use the following commands:

```bash
# Install dependencies
npm ci

# Run TypeScript type checking
npm run typecheck

# Run all test suites (JavaScript and Python)
npm test
```

`npm test` runs the complete test pipeline in sequence (`npm run test:js && npm run test:py`). In CI (`.github/workflows/ci.yml`), `npm run typecheck` and `npm test` are executed against Node.js 20.19.5 (from `.nvmrc`) and Python 3.12.

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
# or directly
python3 -m unittest test_fix -v
```

## Contributing

1. Comment `/attempt #NN` on the bounty issue before starting work.
2. Fork the repository and open a PR that references the issue (`Fixes #NN`).
3. After the PR is reviewed and merged, comment your ARC Testnet EVM address on
   the issue. The bounty is paid in test USDC on ARC Testnet.
