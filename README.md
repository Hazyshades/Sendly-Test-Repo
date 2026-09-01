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

Runs the Node.js test runner across all JavaScript test suites (`node --test "**/*.test.js"`).

### Test Suites

#### JavaScript / Node.js Suites (run via `npm run test:js`)
- `upload_file.test.js`
- `login_upload.test.js`
- `file_upload_component.test.js`
- `double_submit_race.test.js`
- `use_file_upload_errors.test.js`
- `test_suite_wiring.test.js`
- `components/file_upload.test.js`

#### Python CLI Suite
Runs through the shared script:

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

### Running Tests
To run the JavaScript test suite:
`npm test`

To run the Python test suite:
`python3 -m unittest test_fix -v`
