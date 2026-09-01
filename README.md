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

Node.js version is pinned to `20.19.5` in `.nvmrc` (single source of truth for
local and CI tooling).

```bash
npm ci                              # reproducible install from the committed package-lock.json
npm test                            # full pipeline: npm run test:js && npm run test:py
npm run test:js                     # JavaScript suites only (node --test)
npm run test:py                     # Python CLI suite (python3 -m unittest test_fix -v)
npm run typecheck                   # TypeScript (tsc --noEmit)
```

`npm test` runs the JS and Python suites in sequence and fails (non-zero exit)
when either one fails. CI runs the same pipeline plus `npm run typecheck`
(see `.github/workflows/ci.yml`).

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
