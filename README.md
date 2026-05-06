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
node ./src/cli.js interface inspect-system interface/systems/aix-interface-system.yaml
node ./src/cli.js interface plan interface/requirements/contract-inspection.yaml --system interface/systems/aix-interface-system.yaml --research interface/research/aix-findings.yaml
node ./src/cli.js interface inspect-plan interface/plans/contract-inspection.plan.yaml
node ./src/cli.js interface prompt interface/plans/contract-inspection.plan.yaml
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

## Interface Orchestration

AIX also supports design-system-aware interface planning:

```txt
inspect-system -> plan -> inspect-plan -> prompt
```

The interface workflow turns structured UX requirements, research findings, and design-system rules into a traceable interface plan. It chooses approved patterns and components first, flags gaps instead of inventing UI, and generates implementation guidance only after a valid plan exists.

Design systems are variable. Use an existing AIX system YAML, or import a portable Open Design-style `DESIGN.md` into an AIX interface system:

```bash
node ./src/cli.js interface import-design-md path/to/DESIGN.md --name "Brand Interface System" --out interface/systems/brand-interface-system.yaml
```

The first included proof case is an AIX contract inspection review screen.

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
- [Interface orchestration](docs/interface.md)
- [Contract schema](docs/schema.md)
- [Examples](docs/examples.md)
- [Principles](docs/principles.md)
- [Framework overview](docs/framework.md)

---

## End-of-Day Reports

When the user asks for an EOD report, create a dated report under `docs/` and include it in the repo.
