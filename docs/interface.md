# Interface Orchestration

AIX interface orchestration turns UX requirements, research findings, and design-system rules into a traceable interface plan.

The goal is orchestration before generation:

```txt
requirement + system + research -> interface plan -> inspected prompt
```

## Workflow

```bash
node ./src/cli.js interface inspect-system packages/aix-design/interface/systems/aix-interface-system.yaml
node ./src/cli.js interface plan packages/aix-design/interface/requirements/contract-inspection.yaml --system packages/aix-design/interface/systems/aix-interface-system.yaml --research packages/aix-design/interface/research/aix-findings.yaml
node ./src/cli.js interface inspect-plan packages/aix-design/interface/plans/contract-inspection.plan.yaml
node ./src/cli.js interface prompt packages/aix-design/interface/plans/contract-inspection.plan.yaml
```

## Variable Design Systems

AIX does not require one fixed design-system library. Teams can use any compatible AIX interface system YAML and can generate one from a portable Open Design-style `DESIGN.md`:

```bash
node ./src/cli.js interface import-design-md path/to/DESIGN.md --name "Brand Interface System" --out packages/aix-design/interface/systems/brand-interface-system.yaml
node ./src/cli.js interface inspect-system packages/aix-design/interface/systems/brand-interface-system.yaml
```

The importer preserves the AIX orchestration boundary: it converts the design reference into tokens, components, patterns, and accessibility rules, then the normal `plan` command still decides whether a requirement can be satisfied by that system.

## Artifacts

Interface systems define approved tokens, components, patterns, and accessibility rules.

Research findings define user goals, pain points, implications, task coverage, and information coverage.

Interface requirements define the screen goal, task type, risk level, required information, actions, and constraints.

Interface plans define selected patterns and components, information hierarchy, research traceability, gaps, validation checks, and the generation boundary.

## Included Proof Case

The first included proof case is an AIX contract inspection review screen:

- `packages/aix-design/interface/systems/aix-interface-system.yaml`
- `packages/aix-design/interface/research/aix-findings.yaml`
- `packages/aix-design/interface/requirements/contract-inspection.yaml`
- `packages/aix-design/interface/plans/contract-inspection.plan.yaml`

The plan prioritizes readiness, validation, warnings, suggestions, and next actions.

## Design Boundary

AIX should choose approved components and patterns first.

If the system cannot satisfy a requirement, AIX lists a gap instead of inventing UI.

Prompt generation should happen only after a valid interface plan exists.
