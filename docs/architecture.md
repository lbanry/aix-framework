# AIX Module Architecture

AIX is organized as an npm workspace monorepo with one root CLI and two related packages.

## Packages

### `packages/aix-core`

Core AIX Framework package. It owns contract-driven AI collaboration:

- contract schemas
- contract examples
- validation
- inspection
- prompt generation
- execution preparation

The core package must stay system-agnostic. It should not import from the design package.

### `packages/aix-design`

AIX Design package. It owns design-system-aware interface orchestration:

- design system definitions
- UX research findings
- interface requirements
- interface plans
- design Markdown import
- interface planning, inspection, and prompt generation

The design package extends the AIX workflow model, but interface-specific behavior should remain here.

## Root CLI

The root `src/cli.js` composes both packages into one user-facing command:

```bash
aix inspect <contract>
aix prompt <contract>
aix interface inspect-system <system>
aix interface plan <requirement> --system <system> --research <research>
```

This keeps the command surface simple while preserving module boundaries internally.

## Local Prototypes

`prototypes/` is intentionally gitignored. Prototype websites and screenshots are local outputs, not framework source. Keep framework and design-module artifacts in `packages/`; keep generated prototype implementations local unless explicitly approved for publishing.
