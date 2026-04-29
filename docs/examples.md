# AIX Examples

The repo includes valid example contracts that demonstrate common AIX use cases.

## Project Contract

Path:

```txt
examples/project-contract.yaml
```

Purpose:

```txt
Analyze a defined project outcome to produce a structured AI assistance plan.
```

Commands:

```bash
npm run inspect:project
npm run prompt:project
npm run test:project
```

Use this example when the human wants AI assistance with a project, task, or planning outcome.

## Research Contract

Path:

```txt
examples/research-contract.yaml
```

Purpose:

```txt
Analyze source material to produce a concise research summary for a human decision.
```

Commands:

```bash
npm run inspect:research
npm run prompt:research
```

Use this example when the human wants a source-grounded summary that separates findings, assumptions, and uncertainty.

## Test Fixtures

The `tests/fixtures/` directory includes contracts for automated smoke testing:

- `strong-contract.yaml`
- `weak-contract.yaml`
- `invalid-contract.yaml`

Run all smoke tests with:

```bash
npm test
```
