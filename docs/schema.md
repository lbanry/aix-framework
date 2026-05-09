# AIX Contract Schema

An AIX contract is a YAML object with five required sections:

```txt
intent
context
constraints
execution
validation
```

The schema lives at `packages/aix-core/spec/aix-contract.schema.json`.

## intent

Defines what the human wants the AI to accomplish.

Required fields:

- `objective`: non-empty string describing the desired outcome.
- `success_criteria`: non-empty list of reviewable success conditions.

Example:

```yaml
intent:
  objective: Analyze source material to produce a concise research summary.
  success_criteria:
    - The main findings are clear
    - Remaining uncertainty is stated
```

## context

Defines what the AI should know before acting.

Required fields:

- `project`: non-empty project or task name.
- `inputs`: non-empty list of source material.

Optional fields:

- `prior_decisions`: list of decisions or assumptions to preserve.

## constraints

Defines boundaries for AI behavior.

Required fields:

- `rules`: non-empty list of rules the AI must follow.
- `disallowed`: non-empty list of behaviors or outputs to avoid.

Optional fields:

- `tools_allowed`: list of tools or capabilities the AI may use.

## execution

Defines how the AI should approach the task.

Required fields:

- `mode`: one of `plan`, `analyze`, `generate`, `execute`, `validate`, or `refine`.
- `output_format`: non-empty string describing the expected output shape.

Optional fields:

- `verbosity`: one of `low`, `medium`, or `high`.

## validation

Defines how the output should be reviewed.

Required fields:

- `checks`: non-empty list of correctness checks.
- `definition_of_done`: non-empty list of completion conditions.

## Strictness

The schema rejects:

- missing required sections
- missing required nested fields
- empty required strings
- empty required arrays
- unsupported extra fields

This keeps contracts predictable and easier to inspect.
