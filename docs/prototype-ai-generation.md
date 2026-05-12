# Prototype AI Generation Contract

AIX prototype AI assistance is opt-in. The default prototype path remains deterministic:

```text
interface plan + interface system YAML -> static prototype -> validation report
```

`aix interface prototype context` prepares a `prototype-context.json` artifact for agents, but the artifact itself does not call a model and records `model_calls: false`.

## Context Consumption

Agents should read `prototype-context.json` in this order:

1. `ai_boundary`
2. `ai_generation`
3. `validation_report`
4. `interface_plan`
5. `interface_system`
6. `design_markdown`
7. `prototype_manifest`

The `ai_generation.default_phase` is `review`. In that phase, agents may summarize risks, explain validation findings, and recommend next steps. They must not write files.

## Phase Contracts

| Phase | Default Writes | Purpose |
| --- | --- | --- |
| `review` | No | Review context, design-system fit, and validation findings. |
| `repair` | No | Propose minimal repairs for validation findings. |
| `variant` | No | Draft an alternative direction that preserves the normalized interface system contract. |
| `generate` | No | Reserved for future explicitly enabled AI generation. |

Any write requires explicit approval. Generated prototype output remains local-only under `prototypes/` unless explicitly approved for commit.

## Prompt Template

```text
Read prototype-context.json.

Follow ai_boundary and ai_generation exactly.

Use review phase unless another phase is explicitly requested.

Do not call an AI provider from AIX tooling.
Do not write files unless explicit approval is present in the current user request.
Do not commit prototype output under prototypes/ unless explicitly approved.

Report:
- whether the context is complete
- validation findings that matter
- design-system constraints that affect the work
- next recommended action
```
