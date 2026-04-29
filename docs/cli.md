# AIX CLI

The AIX CLI validates contracts, inspects contract quality, and prepares prompts for AI-assisted work.

Commands can be run from any current working directory when paths are provided correctly.

## Install

```bash
npm install
```

## Commands

### init

Creates a valid AIX contract template.

```bash
node ./src/cli.js init my-contract.yaml
```

Safety behavior:

- Requires a `.yaml` or `.yml` filename.
- Refuses to overwrite an existing file.
- Requires the target directory to already exist.

### inspect

Validates a contract and reports contract quality.

```bash
node ./src/cli.js inspect examples/project-contract.yaml
```

`inspect` is read-only. It reports:

- schema validation failures
- contract readiness score
- warnings
- suggestions
- suggested improvements

### prompt

Generates an AI-ready prompt from a valid contract.

```bash
node ./src/cli.js prompt examples/project-contract.yaml
```

Use this when you want to copy the generated prompt into a chat or agent environment.

### run

Prepares a complete local execution package.

```bash
node ./src/cli.js run examples/project-contract.yaml
```

`run` performs:

```txt
validate -> normalize -> inspect summary -> prepare prompt
```

It does not call an AI model.

## npm Scripts

```bash
npm run inspect:project
npm run prompt:project
npm run inspect:research
npm run prompt:research
npm run test:project
npm test
```

## Running From Another Directory

When running from outside the project directory, use paths from your current location:

```bash
node ./aix-framework/src/cli.js inspect aix-framework/examples/project-contract.yaml
```
