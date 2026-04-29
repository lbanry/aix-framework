# AIX Framework

AIX (AI Experience) Framework is an open-source system for improving how humans and AI agents work together.

It introduces a **contract-driven approach** to replace traditional prompting.

---

## Why AIX?

Prompting is inconsistent because intent, context, and constraints are implicit.

AIX makes them explicit.

---

## Core Idea

Every AI interaction is a contract:

- Intent
- Context
- Constraints
- Execution
- Validation

---

## Quick Start

```bash
npm install
npm run prompt:project
```

---

## CLI Commands

Commands can be run from any current working directory when paths are provided correctly.

```bash
node ./src/cli.js init my-contract.yaml
node ./src/cli.js inspect examples/project-contract.yaml
node ./src/cli.js inspect examples/project-contract.yaml --json
node ./src/cli.js prompt examples/project-contract.yaml
node ./src/cli.js prompt examples/project-contract.yaml --out prompt.md
node ./src/cli.js run examples/project-contract.yaml
```

When running from outside the project directory, use paths from your current location:

```bash
node ./aix-framework/src/cli.js inspect aix-framework/examples/project-contract.yaml
```

---

## Examples

The repo includes two valid example contracts:

- `examples/project-contract.yaml` demonstrates a generic project-assistance contract.
- `examples/research-contract.yaml` demonstrates a research-summary contract.

Run them with:

```bash
npm run inspect:project
npm run prompt:project
npm run inspect:research
npm run prompt:research
```

Run the smoke test suite with:

```bash
npm test
```

---

## v0.1 Workflow

```txt
init -> inspect -> prompt
```

- `init` creates a valid AIX contract template.
- `inspect` reviews the contract for clarity, completeness, and execution risk.
- `prompt` generates an AI-ready prompt from the contract.
- `run` validates, normalizes, summarizes, and prepares the AI-ready prompt without calling an AI model.

---

## Contract Fields

An AIX contract has five core sections:

- `intent` defines the objective and success criteria.
- `context` names the project and lists inputs or prior decisions.
- `constraints` defines rules, allowed tools, and disallowed behaviors.
- `execution` defines the mode, output format, and verbosity.
- `validation` defines checks and the definition of done.

---

## Documentation

- [CLI reference](docs/cli.md)
- [Contract schema](docs/schema.md)
- [Examples](docs/examples.md)
- [Principles](docs/principles.md)
- [Framework overview](docs/framework.md)

---

## End-of-Day Reports

When the user asks for an EOD report, create a dated report under `docs/` and include it in the repo.
