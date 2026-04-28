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

## v0.1 Workflow

```txt
init -> inspect -> prompt
```

- `init` creates a valid AIX contract template.
- `inspect` reviews the contract for clarity, completeness, and execution risk.
- `prompt` generates an AI-ready prompt from the contract.

---

## End-of-Day Reports

When the user asks for an EOD report, create a dated report under `docs/` and include it in the repo.
