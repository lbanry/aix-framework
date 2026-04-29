# AIX CLI

The AIX CLI validates contracts, inspects contract quality, and prepares prompts for AI-assisted work.

Commands can be run from any current working directory when paths are provided correctly.

## Install

```bash
npm install
```

## Commands

### init

Creates a valid AIX contract template.

```bash
node ./src/cli.js init my-contract.yaml
```

Safety behavior:

- Requires a `.yaml` or `.yml` filename.
- Refuses to overwrite an existing file.
- Requires the target directory to already exist.

### inspect

Validates a contract and reports contract quality.

```bash
node ./src/cli.js inspect examples/project-contract.yaml
node ./src/cli.js inspect examples/project-contract.yaml --json
```

`inspect` is read-only. It reports:

- schema validation failures
- contract readiness score
- warnings
- suggestions
- suggested improvements
- machine-readable JSON when `--json` is used

### prompt

Generates an AI-ready prompt from a valid contract.

```bash
node ./src/cli.js prompt examples/project-contract.yaml
node ./src/cli.js prompt examples/project-contract.yaml --out prompt.md
```

Use this when you want to copy the generated prompt into a chat or agent environment.

When `--out` is used, the CLI writes the prompt to a file. Existing files are not overwritten unless `--force` is also provided.

### run

Prepares a complete local execution package.

```bash
node ./src/cli.js run examples/project-contract.yaml
```

`run` performs:

```txt
validate -> normalize -> inspect summary -> prepare prompt
```

It does not call an AI model.

### interface inspect-system

Validates whether an interface system can be used for orchestration.

```bash
node ./src/cli.js interface inspect-system interface/systems/aix-interface-system.yaml
```

### interface plan

Creates a structured interface plan from a requirement, design system, and UX research findings.

```bash
node ./src/cli.js interface plan interface/requirements/contract-inspection.yaml --system interface/systems/aix-interface-system.yaml --research interface/research/aix-findings.yaml
```

Use `--out <file>` to write the generated plan. Existing files are not overwritten unless `--force` is also provided.

### interface inspect-plan

Checks whether an interface plan is ready for prompt generation.

```bash
node ./src/cli.js interface inspect-plan interface/plans/contract-inspection.plan.yaml
```

`inspect-plan` reports unresolved design-system gaps, missing research links, and invalid plan structure.

### interface prompt

Generates implementation guidance from an approved interface plan.

```bash
node ./src/cli.js interface prompt interface/plans/contract-inspection.plan.yaml
```

This command does not render UI. It preserves the orchestration boundary by instructing implementers to use the approved plan, patterns, and components.

## npm Scripts

```bash
npm run inspect:project
npm run prompt:project
npm run inspect:research
npm run prompt:research
npm run test:project
npm test
```

## Running From Another Directory

When running from outside the project directory, use paths from your current location:

```bash
node ./aix-framework/src/cli.js inspect aix-framework/examples/project-contract.yaml
node ./aix-framework/src/cli.js interface inspect-system aix-framework/interface/systems/aix-interface-system.yaml
```
