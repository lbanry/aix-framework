# Interface Orchestration

AIX interface orchestration turns UX requirements, research findings, and design-system rules into a traceable interface plan.

The goal is orchestration before generation:

```txt
DESIGN.md -> interface system YAML -> requirement + research -> interface plan -> inspected prompt or prototype
```

## Workflow

```bash
node ./src/cli.js interface inspect-system packages/aix-design/interface/systems/aix-interface-system.yaml
node ./src/cli.js interface plan packages/aix-design/interface/requirements/contract-inspection.yaml --system packages/aix-design/interface/systems/aix-interface-system.yaml --research packages/aix-design/interface/research/aix-findings.yaml
node ./src/cli.js interface inspect-plan packages/aix-design/interface/plans/contract-inspection.plan.yaml
node ./src/cli.js interface prompt packages/aix-design/interface/plans/contract-inspection.plan.yaml
```

## Variable Design Systems

AIX does not require one fixed design-system library. Teams can use any compatible AIX interface system YAML and can generate one from a portable `DESIGN.md`:

```bash
node ./src/cli.js interface import-design-md path/to/DESIGN.md --name "Brand Interface System" --out packages/aix-design/interface/systems/brand-interface-system.yaml
node ./src/cli.js interface inspect-system packages/aix-design/interface/systems/brand-interface-system.yaml
```

`DESIGN.md` is the AI-readable visual system and UX reasoning layer. The importer preserves the AIX orchestration boundary by converting that design reference into a normalized interface system: tokens, components, patterns, accessibility rules, optional design intent fields, and source traceability. The normal `plan` command still decides whether a requirement can be satisfied by that system.

Recommended `DESIGN.md` sections include:

- Design Philosophy
- Brand Personality
- Color System
- Typography
- Layout Rules
- Component Standards
- Interaction Rules
- Motion Principles
- Accessibility
- Responsive Behavior
- Content Tone
- AI Generation Constraints
- Examples

## Local Prototype Generation

Prototype generation uses the normalized interface system YAML, not raw Markdown:

```bash
node ./src/cli.js interface prototype scaffold packages/aix-design/interface/plans/contract-inspection.plan.yaml --system packages/aix-design/interface/systems/aix-interface-system.yaml --out prototypes/contract-inspection-review
node ./src/cli.js interface prototype verify prototypes/contract-inspection-review --plan packages/aix-design/interface/plans/contract-inspection.plan.yaml --system packages/aix-design/interface/systems/aix-interface-system.yaml --json
node ./src/cli.js interface prototype dev prototypes/contract-inspection-review --port 4173
```

Scaffold writes `index.html`, `prototype.json`, and `validation-report.json`. Generated prototype files belong under gitignored `prototypes/` and are local-only unless explicitly approved for publishing.

## Artifacts

Interface systems define approved tokens, components, patterns, accessibility rules, optional design intent, and optional `DESIGN.md` source traceability.

Components can also include optional `render` metadata. This is the bridge between an approved component name and deterministic prototype HTML:

```yaml
components:
  - id: Button
    purpose: Trigger explicit user actions.
    supports:
      - primary_cta
    render:
      element: button
      variant: primary-action
      layout: inline
      emphasis: primary
      label_style: verb
    rules:
      - Button labels must state the action that will occur.
```

The prototype scaffold uses `render` metadata when present and falls back to conservative semantic surfaces when it is absent.

Research findings define user goals, pain points, implications, task coverage, and information coverage.

Interface requirements define the screen goal, task type, risk level, required information, actions, and constraints.

Interface plans define selected patterns and components, information hierarchy, research traceability, gaps, validation checks, and the generation boundary.

Prototype manifests define source plan/system paths, design-source traceability, rendered sections, approved components, approved patterns, tokens, and stable validation rule IDs.

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

Prompt or prototype generation should happen only after a valid interface plan exists.
