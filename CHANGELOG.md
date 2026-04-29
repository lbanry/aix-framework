# Changelog

## Unreleased

### Added

- `interface` CLI namespace for design-system-aware interface orchestration.
- Interface artifact schemas for systems, research findings, requirements, and plans.
- AIX contract inspection review screen proof case.
- Interface plan prompt generation with an explicit orchestration boundary.
- Smoke tests for interface commands, invalid plans, and missing component gaps.
- Interface plan scorecard covering UX fit, design-system fit, research coverage, accessibility coverage, and generation readiness.
- Paperclip product landing page prototype generated through the AIX interface orchestration workflow.

### Changed

- Package allowlist now includes the `interface/` example artifacts.
- Interface plan gaps now include severity, issue, and impact.
- Interface plan inspection no longer applies contract-inspection hierarchy assumptions to unrelated screen types.

## v0.2.0

### Added

- `npm test` smoke suite for valid, weak, and invalid contracts.
- Test fixtures for strong, weak, and invalid contract inspection.
- AIX principles documentation.
- Dedicated CLI, schema, and examples documentation.
- MIT license.
- Package metadata for repository, keywords, and publishable files.
- GitHub Actions test workflow.

### Changed

- Tightened the contract schema with required nested fields, non-empty arrays, non-empty strings, and unsupported-field rejection.
- Improved schema validation output with human-readable error messages.
- Updated `run` to prepare a complete local execution package instead of implying model execution.
- Expanded README documentation links.
- Added `inspect --json` for machine-readable inspection output.
- Added `prompt --out` for writing generated prompts to files.
- Updated package version to `0.2.0`.

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
