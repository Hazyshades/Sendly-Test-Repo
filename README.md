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

```bash
npm ci   # reproducible install from the committed package-lock.json
npm test
```

Runs the Node.js test runner across all JavaScript test suites (`node --test`). Node.js version is pinned to `20.19.5` in `.nvmrc`.

### Test Suites

#### JavaScript / Node.js Suites (run in CI via `npm test`)
- `upload_file.test.js`
- `login_upload.test.js`
- `file_upload_component.test.js`
- `double_submit_race.test.js`
- `components/file_upload.test.js`

#### Python CLI Suite
To run the Python CLI test suite (`test_fix.py`):

```bash
python3 -m unittest test_fix.py
```
or:
```bash
python test_fix.py
```

## Contributing

1. Comment `/attempt #NN` on the bounty issue before starting work.
2. Fork the repository and open a PR that references the issue (`Fixes #NN`).
3. After the PR is reviewed and merged, comment your ARC Testnet EVM address on
   the issue. The bounty is paid in test USDC on ARC Testnet.
