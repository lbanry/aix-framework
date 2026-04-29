# Changelog

## Unreleased

### Added

- `npm test` smoke suite for valid, weak, and invalid contracts.
- Test fixtures for strong, weak, and invalid contract inspection.
- AIX principles documentation.

### Changed

- Tightened the contract schema with required nested fields, non-empty arrays, non-empty strings, and unsupported-field rejection.
- Improved schema validation output with human-readable error messages.
- Updated `run` to prepare a complete local execution package instead of implying model execution.

### Removed

- Empty root `example.yaml`.

## v0.1.0

Initial experimental release of the AIX Framework.

### Added

- AIX contract schema for structured AI collaboration.
- CLI commands:
  - `init`
  - `inspect`
  - `prompt`
  - `run`
- Contract inspection with readiness scoring and read-only improvement guidance.
- AI-ready prompt generation from valid contracts.
- Example project contract.
- Documentation for CLI usage, contract fields, and EOD reports.

### Changed

- Schema loading now works from any current working directory.
- README conflict markers were removed and project documentation was stabilized.

### Removed

- Empty legacy RAG example contract and its broken script entry.

### Validation

Validated with:

```bash
npm run inspect:project
npm run prompt:project
npm run test:project
node ./aix-framework/src/cli.js inspect aix-framework/examples/project-contract.yaml
```
