# @aix/design

AIX Design package for design-system-aware interface orchestration.

This package owns:

- interface system schemas and examples
- UX research findings
- interface requirements
- interface plans
- design Markdown import
- interface planning, inspection, prompt generation, and deterministic local prototype generation

It extends the AIX workflow for UX/UI planning while keeping interface-specific logic out of the core framework package.

## DESIGN.md

`DESIGN.md` is the preferred AI-readable source for visual system and UX reasoning. AIX imports it into normalized interface system YAML so generation can use stable tokens, components, patterns, accessibility rules, design intent, and source traceability.

Imported components may include optional `render` metadata. This keeps the interface system deterministic while giving prototype scaffolding enough information to choose semantic HTML elements and variants.

## Prototypes

Prototype scaffolding is deterministic and does not call an AI model. Generated files should be written under the repo-level `prototypes/` directory, which is local-only by default.
