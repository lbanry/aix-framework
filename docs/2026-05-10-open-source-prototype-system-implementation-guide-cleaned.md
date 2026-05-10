# Open Source Implementation Guide: Design-System-Agnostic Prototype Generation System

Based on: *Building a Design-System-Agnostic Prototype Generation System from Scratch*  
Source date: 2026-04-22  
Cleaned from manual OCR extraction: 2026-05-10

## Executive Summary

This guide maps each of the seven architectural layers in the prototype system specification to concrete open source technologies, provides dependency lists, and gives step-by-step implementation guidance.

The system is built primarily on a **Node.js / TypeScript** stack, using battle-tested open source libraries rather than building everything from scratch.

## Recommended Technology Stack Overview

| Layer | Primary Technologies | Key Libraries |
| --- | --- | --- |
| 1. Requirements Engine | TypeScript, unified/remark | `remark`, `gray-matter`, `yaml`, `zod` |
| 2. Design System Adapter | Style Dictionary, Figma REST API | `style-dictionary`, `figma-js`, `token-transformer` |
| 3. Pattern Library | Custom registry, JSON/YAML | `ajv`, `fast-glob`, `cheerio` |
| 4. Generation Engine | Handlebars/Nunjucks templates | `nunjucks`, `handlebars`, `cheerio`, `jsdom` |
| 5. Validation Engine | PostCSS, HTMLHint, axe-core | `postcss`, `stylelint`, `axe-core`, `cheerio`, `htmlhint` |
| 6. Feedback Loop | Structured YAML logs, Git hooks | `js-yaml` or `yaml`, `chokidar`, `simple-git` |
| 7. CLI Tool (`proto`) | Commander.js or oclif | `commander`, `inquirer`, `chalk`, `ora` |

Recommended baseline:

- **Runtime:** Node.js >= 20 LTS
- **Language:** TypeScript 5.x in strict mode
- **Package manager:** pnpm
- **Build:** tsup or esbuild
- **Test:** Vitest
- **Lint:** ESLint + Prettier

## Project Bootstrap

### 1. Initialize The Monorepo

```bash
mkdir proto-system && cd proto-system
pnpm init
```

Create `pnpm-workspace.yaml`:

```yaml
packages:
  - "packages/*"
```

### 2. Directory And Package Layout

```text
proto-system/
├── pnpm-workspace.yaml
├── package.json
├── tsconfig.base.json
├── packages/
│   ├── core/                    # Shared types, config loaders, semantic token resolver
│   ├── requirements-engine/     # Layer 1: BRD parsing, view-state maps, phase planner
│   ├── design-system-adapter/   # Layer 2: Token ingestion, component maps, validator generation
│   ├── pattern-library/         # Layer 3: Registry, slot types, promotion engine
│   ├── generation-engine/       # Layer 4: Shell selection, composition, wiring
│   ├── validation-engine/       # Layer 5: Pluggable validators
│   ├── feedback-loop/           # Layer 6: Structured logs, staleness, promotion
│   └── cli/                     # Layer 7: proto CLI
├── config/                      # User-editable tool configs
├── templates/                   # Base HTML templates
├── patterns/                    # Pattern registry and manifests
├── guidelines/                  # Generated and curated docs
├── validators/                  # User-extensible validator plugins
└── docs/
```

### 3. Root `package.json`

```json
{
  "name": "proto-system",
  "engines": {
    "node": ">=20"
  },
  "scripts": {
    "build": "pnpm -r run build",
    "test": "pnpm -r run test",
    "lint": "eslint . --ext .ts",
    "proto": "node packages/cli/dist/index.js"
  },
  "devDependencies": {
    "typescript": "^5.5.0",
    "tsup": "^8.1.0",
    "eslint": "^9.5.0",
    "@typescript-eslint/eslint-plugin": "^8.0.0",
    "@typescript-eslint/parser": "^8.0.0",
    "prettier": "^3.3.0"
  }
}
```

## Layer-By-Layer Implementation

## Layer 1: Requirements Engine

**Purpose:** Parse BRDs, extract acceptance criteria, generate view-state maps, and plan phases.

### Dependencies

```json
{
  "dependencies": {
    "unified": "^11.0.0",
    "remark-parse": "^11.0.0",
    "remark-gfm": "^4.0.0",
    "remark-frontmatter": "^5.0.0",
    "gray-matter": "^4.0.3",
    "yaml": "^2.4.0",
    "zod": "^3.23.0"
  }
}
```

### Key Implementation Details

#### 1.1 BRD Parser

Use `unified` and `remark-parse` to parse Markdown BRDs into an AST, then walk the AST to extract structured sections.

```ts
// packages/requirements-engine/src/brd-parser.ts
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkFrontmatter from "remark-frontmatter";
import matter from "gray-matter";
import { z } from "zod";

const AcceptanceCriterionSchema = z.object({
  id: z.string(),
  description: z.string(),
  category: z.string().optional()
});

const FieldDefinitionSchema = z.object({
  name: z.string(),
  type: z.string(),
  required: z.boolean()
});

export async function parseBRD(markdownContent: string) {
  const { data: frontmatter, content } = matter(markdownContent);
  const tree = unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkFrontmatter)
    .parse(content);

  return {
    frontmatter,
    tree
  };
}
```

Extractor patterns should be configurable from a file such as `config/brd-parser.yaml`.

#### 1.2 View-State Map Generator

Use pure TypeScript to transform parsed BRD output into a view-state JSON document. Use `zod` for schema validation.

#### 1.3 Phase Planner

Group acceptance criteria by view-state and split work at configurable thresholds. This can be pure TypeScript logic.

### Open Source Alternatives Considered

| Need | Chosen | Alternatives | Why Chosen |
| --- | --- | --- | --- |
| Markdown parsing | `unified` / `remark` | `marked`, `markdown-it` | AST access for structured extraction and strong plugin ecosystem |

## Layer 2: Design System Adapter

**Purpose:** Ingest tokens from any design system, generate semantic maps, and auto-produce validator rules.

### Dependencies

```json
{
  "dependencies": {
    "style-dictionary": "^4.0.0",
    "token-transformer": "^0.0.33",
    "yaml": "^2.4.0",
    "zod": "^3.23.0",
    "figma-js": "^1.16.0",
    "node-fetch": "^3.3.0"
  }
}
```

### Key Implementation Details

#### 2.1 Token Ingestion

Use [Style Dictionary](https://github.com/amzn/style-dictionary) as the core token pipeline. It supports multiple input formats, token transforms, multiple output formats, and custom transforms via a plugin API.

```ts
// packages/design-system-adapter/src/token-ingestor.ts
import StyleDictionary from "style-dictionary";

export async function ingestTokens(configPath: string) {
  const dsConfig = loadDesignSystemConfig(configPath);

  const sd = new StyleDictionary({
    source: [dsConfig.tokens.source],
    platforms: {
      css: {
        transformGroup: "css",
        buildPath: "build/tokens/",
        files: [
          {
            destination: "tokens.css",
            format: "css/variables",
            options: { outputReferences: true }
          }
        ]
      },
      json: {
        transformGroup: "js",
        buildPath: "build/tokens/",
        files: [
          {
            destination: "tokens.json",
            format: "json/flat"
          }
        ]
      }
    }
  });

  await sd.buildAllPlatforms();
  return buildSemanticMap(dsConfig.tokens.semantic_map);
}
```

#### 2.2 Figma Integration

Use `figma-js` or the Figma REST API directly to pull tokens from Figma variables and styles. Use `token-transformer` from Tokens Studio to convert Figma token exports into Style Dictionary format.

```ts
// packages/design-system-adapter/src/figma-ingestor.ts
import * as Figma from "figma-js";

const { data } = await client.file(fileKey);
```

#### 2.3 Token Validator Generator

Auto-generate forbidden pattern rules from the loaded token set. This can be pure TypeScript that reads the semantic map and emits regex patterns.

### Open Source Alternatives Considered

| Need | Chosen | Alternatives | Why Chosen |
| --- | --- | --- | --- |
| Token pipeline | Style Dictionary 4 | Theo, `design-tokens` | Mature, widely adopted, extensible |

## Layer 3: Pattern Library

**Purpose:** Registry of canonical patterns, typed slots, and correction-driven promotion.

### Dependencies

```json
{
  "dependencies": {
    "ajv": "^8.16.0",
    "fast-glob": "^3.3.0",
    "cheerio": "^1.0.0",
    "yaml": "^2.4.0",
    "zod": "^3.23.0"
  }
}
```

### Key Implementation Details

#### 3.1 Registry

Use a JSON file such as `patterns/registry.json`, validated at load time with `ajv` or `zod`. Each entry declares `semantic_role`, `use_when`, `do_not_use_when`, source file, and manifest path.

```ts
// packages/pattern-library/src/registry.ts
import { z } from "zod";

const PatternEntrySchema = z.object({
  source: z.string(),
  manifest: z.string(),
  semantic_role: z.string(),
  use_when: z.array(z.string()),
  do_not_use_when: z.array(z.string())
});

const RegistrySchema = z.object({
  patterns: z.record(z.string(), PatternEntrySchema)
});

export function loadRegistry(registryPath: string) {
  const raw = readFileSync(registryPath, "utf8");
  return RegistrySchema.parse(JSON.parse(raw));
}
```

#### 3.2 Typed Slots

Use `cheerio` to parse HTML templates and validate slot contents against type constraints declared in HTML comments.

#### 3.3 Promotion Engine

Scan structured learning logs, aggregate corrections, and surface promotion candidates when frequency exceeds the configured threshold.

## Layer 4: Generation Engine

**Purpose:** Three-phase generation: shell selection, component composition, and behavior wiring.

### Dependencies

```json
{
  "dependencies": {
    "nunjucks": "^3.2.4",
    "handlebars": "^4.7.8",
    "cheerio": "^1.0.0",
    "jsdom": "^24.1.0",
    "yaml": "^2.4.0",
    "zod": "^3.23.0"
  }
}
```

### Key Implementation Details

#### 4.1 Template Engine Choice: Nunjucks

[Nunjucks](https://mozilla.github.io/nunjucks/) is recommended over Handlebars for this use case because it supports:

- Macros for reusable component snippets
- Filters for token transformation
- Conditionals and loops
- Auto-escaping by default

```ts
// packages/generation-engine/src/renderer.ts
import nunjucks from "nunjucks";

export function createRenderer(templateDirs: string[], designSystem: DesignSystemConfig) {
  const env = new nunjucks.Environment(
    new nunjucks.FileSystemLoader(templateDirs, { watch: false }),
    { autoescape: true }
  );

  env.addFilter("token", (semanticName: string) => {
    const resolved = designSystem.semantic_map[semanticName];
    return `var(--${resolved})`;
  });

  env.addFilter("prefix", (className: string) => {
    return `${designSystem.prefix}-${className}`;
  });

  return env;
}
```

#### 4.2 Shell Selection

Implement the decision tree from the spec. Load the tree from `config/workflows.yaml` and traverse it based on view-state map properties.

#### 4.3 Component Lookup Protocol

1. Query the pattern registry by semantic role.
2. Fall back to the component map from the design system adapter.
3. Compose from scratch only when necessary, and flag that in the build log.

Use `cheerio` for DOM manipulation: inserting components into slots, setting attributes, and wiring data visibility.

### Why Nunjucks Over Alternatives

| Need | Chosen | Alternatives | Why Chosen |
| --- | --- | --- | --- |
| HTML templating | Nunjucks | Handlebars, EJS, Pug, Liquid | Template inheritance, macros, rich filters |
| DOM manipulation | Cheerio | jsdom, Linkedom, parse5 | Fast, jQuery-like API, no browser emulation overhead |
| Behavior testing | jsdom | happy-dom, Linkedom | Complete DOM implementation |

## Layer 5: Validation Engine

**Purpose:** Pluggable validators for token compliance, structural fidelity, pattern adherence, CSS conflicts, accessibility, and semantic structure.

### Dependencies

```json
{
  "dependencies": {
    "postcss": "^8.4.0",
    "stylelint": "^16.6.0",
    "axe-core": "^4.9.0",
    "cheerio": "^1.0.0",
    "jsdom": "^24.1.0",
    "htmlhint": "^1.1.0",
    "css-tree": "^2.3.0",
    "specificity": "^1.0.0"
  }
}
```

### Key Implementation Details

#### 5.1 Pluggable Architecture

Each validator exports a `validate(html, css, config)` function.

```ts
// packages/validation-engine/src/types.ts
export interface ValidationResult {
  errors: ValidationMessage[];
  warnings: ValidationMessage[];
  info: ValidationMessage[];
}

export interface ValidationMessage {
  rule: string;
  message: string;
  line?: number;
  column?: number;
  selector?: string;
  fix?: string;
}

export type Validator = (
  html: string,
  css: string,
  config: DesignSystemConfig
) => Promise<ValidationResult> | ValidationResult;
```

#### 5.2 Validator Implementations

| Validator | Primary Library | What It Does |
| --- | --- | --- |
| `token-compliance` | `postcss` + `css-tree` | Walks CSS AST and flags hardcoded colors or spacing values outside token definitions |
| `template-fidelity` | `cheerio` | Compares prototype DOM structure against base template |
| `pattern-adherence` | `cheerio` + pattern registry | Flags non-canonical implementations |
| `css-html-conflicts` | `postcss` + `cheerio` | Detects `[hidden]` plus `display` conflicts and z-index issues |
| `accessibility` | `axe-core` + `jsdom` | Runs axe-core checks for WCAG issues, ARIA attributes, and focus behavior |
| `semantic-structure` | `cheerio` | Validates semantic HTML usage |
| `native-element-check` | `cheerio` | Flags native elements when design system components exist |
| `class-naming` | regex | Checks CSS class prefix consistency |

#### 5.3 Accessibility Validation With axe-core

```ts
// packages/validation-engine/src/validators/accessibility.ts
import { JSDOM } from "jsdom";
import axe from "axe-core";

export async function validateAccessibility(html: string): Promise<ValidationResult> {
  const dom = new JSDOM(html, { runScripts: "outside-only" });
  const results = await axe.run(dom.window.document.documentElement, {
    rules: {
      "color-contrast": { enabled: true },
      "aria-required-attr": { enabled: true }
    }
  });

  return {
    errors: results.violations.map((v) => ({
      rule: v.id,
      message: v.description,
      selector: v.nodes[0]?.target?.join(""),
      fix: v.nodes[0]?.failureSummary
    })),
    warnings: results.incomplete.map((i) => ({
      rule: i.id,
      message: i.description
    })),
    info: []
  };
}
```

#### 5.4 CSS Conflict Detection With PostCSS

```ts
// packages/validation-engine/src/validators/css-html-conflicts.ts
import postcss from "postcss";
import * as cheerio from "cheerio";

export function validateCSSConflicts(html: string, css: string): ValidationResult {
  const $ = cheerio.load(html);
  const root = postcss.parse(css);
  const errors: ValidationMessage[] = [];

  $("[hidden]").each((_, el) => {
    const classes = $(el).attr("class")?.split(" ") ?? [];
    // Walk CSS rules to find display declarations matching these classes.
  });

  return {
    errors,
    warnings: [],
    info: []
  };
}
```

## Layer 6: Feedback Loop

**Purpose:** Structured learning logs, staleness detection, correction tracking, and auto-promotion.

### Dependencies

```json
{
  "dependencies": {
    "yaml": "^2.4.0",
    "chokidar": "^3.6.0",
    "simple-git": "^3.25.0",
    "date-fns": "^3.6.0",
    "zod": "^3.23.0"
  }
}
```

### Key Implementation Details

#### 6.1 Structured Learning Logs

Use YAML files validated with `zod`. Each log is tied to a prototype and its BRD.

#### 6.2 Staleness Detection

Use `chokidar` for file watching during development and `date-fns` to compare prototype `mtime` with log `mtime`. Integrate into CI through a custom validator.

#### 6.3 Correction Aggregation

Scan log files, extract component corrections, group by `(original, corrected_to)` pairs, and surface candidates exceeding the promotion threshold.

#### 6.4 Git Integration

Use `simple-git` to track which prototypes changed in a commit, trigger staleness checks, and enforce log updates through Git hooks.

```ts
// packages/feedback-loop/src/staleness.ts
import { differenceInHours } from "date-fns";

export function checkStaleness(
  prototypePath: string,
  logPath: string,
  config: FeedbackConfig
): "ok" | "warn" | "fail" {
  const protoMtime = statSync(prototypePath).mtime;
  const logMtime = statSync(logPath).mtime;
  const hoursDiff = differenceInHours(protoMtime, logMtime);

  if (hoursDiff > config.staleness.fail_after_hours) return "fail";
  if (hoursDiff > config.staleness.warn_after_hours) return "warn";
  return "ok";
}
```

## Layer 7: CLI Tool (`proto`)

**Purpose:** Unified CLI with clear command groups.

### Dependencies

```json
{
  "dependencies": {
    "commander": "^12.1.0",
    "inquirer": "^9.3.0",
    "chalk": "^5.3.0",
    "ora": "^8.0.0",
    "open": "^10.1.0"
  }
}
```

### Why Commander.js Over oclif

| Framework | Pros | Cons |
| --- | --- | --- |
| Commander.js | Lightweight, simple subcommand API, low setup | No plugin system, manual help formatting |
| oclif | Plugin architecture, generated docs, topic grouping | Heavier, more boilerplate, steeper learning curve |

Recommendation: start with Commander.js for simplicity. Migrate to oclif later if the project needs a plugin ecosystem for community validators and adapters.

### CLI Structure

```ts
// packages/cli/src/index.ts
import { Command } from "commander";

const program = new Command();
program
  .name("proto")
  .description("Design-system-agnostic prototype generation")
  .version("1.0.0");

const intake = program.command("intake").description("Requirements pipeline");

intake
  .command("parse")
  .description("Parse a BRD")
  .argument("<brd>", "Path to BRD markdown")
  .action(async (brd) => {
    // call requirements-engine
  });

intake
  .command("approve")
  .description("Approve intake review")
  .argument("<name>")
  .action(async (name) => {
    // approve gate
  });

program
  .command("scaffold")
  .description("Phase A: shell from template")
  .argument("<name>")
  .action(async (name) => {
    // call generation-engine shell selection
  });

program
  .command("compose")
  .description("Phase B: components from registry")
  .argument("<name>")
  .action(async (name) => {
    // call generation-engine composition
  });

program
  .command("wire")
  .description("Phase C: behavior from flows")
  .argument("<name>")
  .action(async (name) => {
    // call generation-engine wiring
  });

program
  .command("audit")
  .description("Composition audit")
  .argument("<prototype>")
  .action(async (prototype) => {
    // pattern-adherence check
  });

const feedback = program.command("feedback").description("Correction tracking");

feedback
  .command("log")
  .description("Log a correction")
  .requiredOption("--prototype <file>", "Prototype file")
  .requiredOption("--component <name>", "Original component")
  .requiredOption("--corrected-to <name>", "Corrected component")
  .option("--reason <text>", "Reason for correction")
  .action(async (opts) => {
    // call feedback-loop
  });

feedback
  .command("scan")
  .description("Find promotion candidates")
  .action(async () => {
    // call feedback-loop aggregation
  });

feedback
  .command("promote")
  .description("Draft guideline from correction")
  .argument("<id>")
  .action(async (id) => {
    // call feedback-loop promotion
  });

const ds = program.command("ds").description("Design system management");

ds.command("init")
  .description("Initialize from token source")
  .action(async () => {
    // initialize design-system.yaml
  });

ds.command("validate")
  .description("Check config completeness")
  .action(async () => {
    // validate design-system.yaml
  });

program
  .command("dev")
  .description("Live preview server")
  .argument("<prototype>", "Prototype HTML file")
  .action(async (prototype, opts) => {
    // start dev server
  });

program.parse();
```

## Dev Preview Server

For `proto dev`, use Vite in middleware mode or a lightweight server.

```json
{
  "dependencies": {
    "vite": "^5.3.0"
  }
}
```

Vite provides HMR out of the box, which is useful for rapid prototype iteration.

## Complete Dependency Summary

### Production Dependencies

#### Core / Shared

- `zod@^3.23.0` - schema validation
- `yaml@^2.4.0` - YAML config loading

#### Layer 1: Requirements Engine

- `unified@^11.0.0`
- `remark-parse@^11.0.0`
- `remark-gfm@^4.0.0`
- `remark-frontmatter@^5.0.0`
- `gray-matter@^4.0.3`
- `glob@^10.4.0`

#### Layer 2: Design System Adapter

- `style-dictionary@^4.0.0`
- `token-transformer@^0.0.33`
- `figma-js@^1.16.0`
- `node-fetch@^3.3.0`

#### Layer 3: Pattern Library

- `ajv@^8.16.0`
- `fast-glob@^3.3.0`

#### Layer 4: Generation Engine

- `nunjucks@^3.2.4`
- `cheerio@^1.0.0`
- `jsdom@^24.1.0`

#### Layer 5: Validation Engine

- `postcss@^8.4.0`
- `stylelint@^16.6.0`
- `axe-core@^4.9.0`
- `htmlhint@^1.1.0`
- `css-tree@^2.3.0`
- `specificity@^1.0.0`

#### Layer 6: Feedback Loop

- `chokidar@^3.6.0`
- `simple-git@^3.25.0`
- `date-fns@^3.6.0`

#### Layer 7: CLI

- `commander@^12.1.0`
- `inquirer@^9.3.0`
- `chalk@^5.3.0`
- `ora@^8.0.0`
- `cli-table3@^0.6.5`
- `open@^10.1.0`

#### Dev Preview

- `vite@^5.3.0`

### Dev Dependencies

- `typescript@^5.5.0`
- `tsup@^8.1.0`
- `vitest@^2.0.0`
- `eslint@^9.5.0`
- `prettier@^3.3.0`
- `@types/node@^20.14.0`
- `@types/nunjucks@^3.2.6`
- `@types/jsdom@^21.1.7`

## Implementation Roadmap

### Phase 1: Foundation (Weeks 1-2)

1. Bootstrap the monorepo with pnpm workspaces.
2. Build `packages/core` for shared types, YAML config loaders, and semantic token resolution.
3. Build `packages/design-system-adapter` with Style Dictionary integration, Figma ingestion, and semantic map building.
4. Create a sample design system config.

Milestone: `proto ds init --from style-dictionary --file tokens.json` works end-to-end.

### Phase 2: Registry And Requirements (Weeks 3-4)

1. Build `packages/pattern-library` with registry loading, semantic role lookup, and slot type validation.
2. Build `packages/requirements-engine` with BRD parsing, view-state map generation, and phase planning.
3. Add CLI commands: `proto intake parse` and `proto intake approve`.

Milestone: `proto intake parse my-brd.md` outputs a structured spec with a view-state map.

### Phase 3: Generation (Weeks 5-7)

1. Build `packages/generation-engine` with Nunjucks rendering, shell selection, registry-based component composition, and behavior wiring.
2. Create base templates for four to five common layouts.
3. Add CLI commands: `proto scaffold`, `proto compose`, and `proto wire`.

Milestone: `proto scaffold my-feature && proto compose my-feature && proto wire my-feature` produces a working HTML prototype.

### Phase 4: Validation (Weeks 8-9)

1. Build `packages/validation-engine` with pluggable architecture and the core validators.
2. Auto-generate token compliance rules from design system config.
3. Add CLI commands: `proto verify` and `proto audit`.

Milestone: `proto verify prototype.html` reports token violations, CSS conflicts, accessibility issues, and pattern adherence.

### Phase 5: Feedback Loop (Weeks 10-11)

1. Build `packages/feedback-loop` with structured log schema, staleness detection, correction aggregation, and promotion.
2. Add Git hook integration for staleness enforcement.
3. Add CLI commands: `proto feedback log`, `proto feedback scan`, and `proto feedback promote`.

Milestone: correction tracking and promotion candidates work across multiple prototypes.

### Phase 6: Polish And Docs (Weeks 12-13)

1. Add dev preview server with `proto dev` and Vite HMR.
2. Write documentation:
   - `docs/setup.md`
   - `docs/adding-a-design-system.md`
   - `docs/writing-validators.md`
3. Add a GitHub Actions CI pipeline for test, lint, build, and `proto verify`.
4. Publish to npm as scoped packages.

## Open Source Licensing And Publishing

### Recommended License

Use MIT or Apache 2.0. Both are permissive and widely adopted for design tooling. Apache 2.0 provides explicit patent grants, which may be preferable for enterprise adoption.

### npm Publishing Strategy

- `@proto-system/core`
- `@proto-system/requirements-engine`
- `@proto-system/design-system-adapter`
- `@proto-system/pattern-library`
- `@proto-system/generation-engine`
- `@proto-system/validation-engine`
- `@proto-system/feedback-loop`
- `@proto-system/cli`

Users install:

```bash
npm install -g @proto-system/cli
```

### GitHub Repository Setup

```yaml
# .github/workflows/ci.yml
name: CI

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: pnpm install --frozen-lockfile
      - run: pnpm run lint
      - run: pnpm run test
      - run: pnpm run build
```

## Community Extension Points

1. **Custom validators:** drop a `.js` or `.ts` file in `validators/` that exports the `Validator` interface.
2. **Custom design system configs:** community-maintained `design-system.yaml` files for systems such as Material, Carbon, Atlassian, Ant Design, and Chakra.
3. **Custom BRD parsers:** parser configs for BRD formats from Confluence, Notion, JIRA exports, and similar tools.
4. **Template packs:** pre-built HTML templates themed for specific design systems.

## Key Architectural Decisions Summary

| Decision | Choice | Rationale |
| --- | --- | --- |
| Language | TypeScript | Type safety, IDE support, npm ecosystem alignment |
| Package manager | pnpm | Fast, disk-efficient, native workspace support |
| Monorepo | pnpm workspaces | Simpler than Nx/Turborepo for this project size |
| Token pipeline | Style Dictionary | Industry standard, extensible, multi-platform output |
| Schema validation | Zod | TypeScript-native, composable, strong error messages |
| CLI framework | Commander.js | Lightweight, well-documented, easy subcommands |
| Dev server | Vite | HMR for rapid iteration, low setup |
| Testing | Vitest | Fast, Vite-native, Jest-compatible API |

## Quick Start After Implementation

```bash
# Install globally
npm install -g @proto-system/cli

# Initialize with your design system tokens
proto ds init --from style-dictionary --file my-tokens.json

# Parse a BRD
proto intake parse requirements/my-feature.md --name my-feature

# Review the generated spec and view-state map, then approve
proto intake approve --name my-feature

# Generate the prototype
proto scaffold my-feature
proto compose my-feature
proto wire my-feature

# Validate
proto verify prototypes/my-feature.html

# Preview
proto dev prototypes/my-feature.html

# Track corrections
proto feedback log \
  --prototype my-feature.html \
  --component "dual-list" \
  --corrected-to "checkboxes" \
  --reason "flat role checklist"

# Check for promotion candidates
proto feedback scan
```

# AI Integration Strategy For The Prototype Generation System

Date: 2026-04-23  
Context: fills the Layer 4.5 AI Integration gap identified in the open source implementation guide analysis.  
Scope: how AI assistants fit into the seven-layer architecture for maximum confidence and consistency.

## Why This Matters

DUPS is built to be operated by AI assistants such as Codex CLI, Copilot, or Devin. The current system works roughly like this:

1. AI reads `AGENTS.md` and gets routed to `Guidelines.md`.
2. AI reads guidelines files in sequence.
3. AI generates a prototype from scratch based on what it read.
4. Human reviews and provides corrections.
5. AI applies corrections.
6. Steps 4-5 repeat many times.

The open source implementation guide defines deterministic tooling layers but does not fully address how AI interacts with those layers.

Without this, there are two failure modes:

- **AI bypasses the tooling:** AI generates prototypes the same way it does today, while the seven layers only serve as post-hoc validation.
- **AI is replaced by the tooling:** the system becomes fully deterministic, removing AI entirely, which is unrealistic for HTML/CSS/JS prototype generation.

The right answer is **AI as a collaborator within the pipeline**. The seven layers provide structure, constraints, and context while AI handles creative generation within those constraints.

## Architecture: Where AI Fits In The Seven Layers

| Layer | AI Role |
| --- | --- |
| Layer 1: Requirements Engine | AI assists with BRD interpretation and ambiguity resolution |
| Layer 2: Design System Adapter | AI consumes token maps and component maps as context |
| Layer 3: Pattern Library | AI consumes registry entries as generation constraints and assists with ambiguous semantic matches |
| Layer 4: Generation Engine | AI drives HTML/CSS/JS generation within constraints |
| Layer 4.5: AI Orchestrator | Context assembly, prompt management, validation loop, provider abstraction |
| Layer 5: Validation Engine | AI consumes validation errors as correction instructions |
| Layer 6: Feedback Loop | AI consumes learning logs and assists with correction categorization and promotion drafts |
| Layer 7: CLI | AI is invoked through structured commands such as `proto generate` |

## Layer 4.5: AI Orchestrator

### Purpose

The AI orchestrator sits between the generation engine and the AI provider.

Responsibilities:

1. **Context assembly:** gather information from Layers 1-3 and 6, then assemble a structured prompt.
2. **Constraint injection:** convert registry entries, token rules, and template structures into generation constraints.
3. **Validation loop:** run validators after AI generation, feed errors back, and regenerate up to a configured limit.
4. **Provider abstraction:** support OpenAI, Anthropic, local models, and other providers through a unified interface.
5. **Prompt management:** store, version, and evolve prompt templates alongside guidelines.

### Package Structure

```text
ai-orchestrator/
├── context-assembler.ts       # Gathers context from all layers
├── context-budget.ts          # Manages token budgets
├── prompt-builder.ts          # Builds structured prompts from context
├── provider.ts                # Abstract LLM provider interface
├── providers/
│   ├── openai.ts
│   ├── anthropic.ts
│   └── ollama.ts
├── validation-loop.ts         # Generate -> validate -> fix cycle
├── agent-config.ts            # Machine-readable AGENTS.md equivalent
└── prompts/
    ├── system.md
    ├── phases/
    │   ├── shell-selection.md
    │   ├── composition.md
    │   └── wiring.md
    └── corrections/
        ├── validation-fix.md
        └── user-feedback.md
```

### Dependencies

```json
{
  "dependencies": {
    "ai": "^4.0.0",
    "tiktoken": "^1.0.0",
    "handlebars": "^4.7.0"
  },
  "optionalDependencies": {
    "@ai-sdk/openai": "^1.0.0",
    "@ai-sdk/anthropic": "^1.0.0"
  }
}
```

### Key Library: Vercel AI SDK

| Need | Vercel AI SDK | Raw Provider SDKs | Why AI SDK |
| --- | --- | --- | --- |
| Provider abstraction | Built in | Manual adapter per provider | Core requirement |
| Structured output | Works with Zod schemas | Manual JSON parsing | Constraint injection needs structured data |
| Tool calling | Built in | Manual function casting | Validation loop can use tool feedback |
| TypeScript-first API | Strong | Varies by provider | Matches stack |

## Implementation: Context Assembly

### Problem With DUPS Today

DUPS tells AI to read many files in order, then generate a prototype. The AI must decide what to read, hold too much context, prioritize conflicting guidance, and remember prior corrections from chat history.

### Solution: Structured Context Documents

The orchestrator pre-assembles a single structured context document containing exactly what the AI needs for the current generation phase.

```ts
// packages/ai-orchestrator/src/context-assembler.ts
import { z } from "zod";

export const GenerationContextSchema = z.object({
  requirements: z.object({
    brdSummary: z.string(),
    acceptanceCriteria: z.array(z.object({
      id: z.string(),
      description: z.string(),
      phase: z.number()
    })),
    viewStateMap: z.object({
      states: z.array(z.object({
        name: z.string(),
        templateMatch: z.string().optional(),
        navigation: z.any().optional(),
        transitions: z.array(z.object({
          from: z.string(),
          to: z.string(),
          trigger: z.string()
        })).optional()
      }))
    }),
    currentPhase: z.number(),
    phaseACs: z.array(z.string())
  }),
  designSystem: z.object({
    semanticMap: z.record(z.string()),
    forbiddenPatterns: z.array(z.object({
      pattern: z.string(),
      message: z.string(),
      fix: z.string()
    })),
    componentMap: z.record(z.object({
      html: z.string()
    }))
  }),
  patterns: z.object({
    matchedPatterns: z.array(z.object({
      semanticRole: z.string(),
      patternName: z.string(),
      sourceHTML: z.string(),
      useWhen: z.array(z.string()),
      doNotUseWhen: z.array(z.string())
    })),
    templateHTML: z.string(),
    slotDefinitions: z.array(z.object({
      id: z.string(),
      type: z.string(),
      accepts: z.array(z.string())
    }))
  }),
  priorLearnings: z.object({
    relevantCorrections: z.array(z.object({
      original: z.string(),
      correctedTo: z.string(),
      reason: z.string(),
      frequency: z.number()
    })),
    priorIterations: z.array(z.object({
      id: z.number(),
      trigger: z.string(),
      correction: z.string().optional()
    })).optional()
  })
});

export type GenerationContext = z.infer<typeof GenerationContextSchema>;
```

## Context Budget Management

AI models have finite context windows. The orchestrator should prioritize context in this order:

1. Template HTML
2. Matched patterns
3. Token CSS
4. Acceptance criteria
5. View-state map
6. Component map
7. Corrections
8. BRD summary

```ts
// packages/ai-orchestrator/src/context-budget.ts
import { encodingForModel } from "tiktoken";

interface ContextBudget {
  systemPrompt: number;
  templateHTML: number;
  matchedPatterns: number;
  tokenCSS: number;
  acceptanceCriteria: number;
  viewStateMap: number;
  componentMap: number;
  corrections: number;
  brdSummary: number;
}

const DEFAULT_BUDGET: ContextBudget = {
  systemPrompt: 2000,
  templateHTML: 8000,
  matchedPatterns: 6000,
  tokenCSS: 2000,
  acceptanceCriteria: 3000,
  viewStateMap: 2000,
  componentMap: 4000,
  corrections: 2000,
  brdSummary: 3000
};
```

## Implementation: Prompt Management

### Why Prompts Need Version Control

The existing `AGENTS.md` style approach mixes project description, file routing, template selection, validation commands, token values, and component patterns. Prompt templates should be versioned as code and assembled from structured context.

```ts
// packages/ai-orchestrator/src/prompt-builder.ts
import Handlebars from "handlebars";
import { readFileSync } from "node:fs";
import { GenerationContext } from "./context-assembler";

export function buildPrompt(
  phase: "shell" | "compose" | "wire",
  context: GenerationContext
): { system: string; user: string } {
  const systemTemplate = readFileSync("prompts/system.md", "utf8");
  const phaseTemplate = readFileSync(`prompts/phases/${phase}.md`, "utf8");

  const system = Handlebars.compile(systemTemplate)({
    designSystemName: context.designSystem.semanticMap,
    forbiddenPatterns: context.designSystem.forbiddenPatterns,
    corrections: context.priorLearnings.relevantCorrections
  });

  const user = Handlebars.compile(phaseTemplate)(context);

  return { system, user };
}
```

### System Prompt Template

```markdown
You are a prototype generation engine for the {{designSystemName}} design system.

## Rules

1. Template-first: extend the provided base HTML template. Modify only designated content areas.
2. Token compliance: every color, spacing, and typography value must use CSS custom properties with the design system prefix.
3. Registry-first composition: use canonical HTML from matched patterns before composing from scratch.
4. Single-file output: all CSS in `<style>` tags and all JS in `<script>` tags.

{{#each forbiddenPatterns}}
- FORBIDDEN: "{{this.pattern}}" -> {{this.message}}. Fix: {{this.fix}}
{{/each}}

{{#if corrections}}
## Prior Corrections

{{#each corrections}}
- Do not use "{{this.original}}"; use "{{this.correctedTo}}" instead. Reason: {{this.reason}}.
{{/each}}
{{/if}}
```

## Implementation: Validation Loop

The validation loop runs validators programmatically between generation rounds, feeding errors back to the AI before the human sees the output.

```ts
// packages/ai-orchestrator/src/validation-loop.ts
interface GenerationResult {
  html: string;
  iterations: number;
  validationHistory: ValidationResult[];
  composedComponents: string[];
}

export async function generateWithValidation(
  context: GenerationContext,
  config: AIConfig
): Promise<GenerationResult> {
  const maxIterations = config.maxValidationIterations ?? 3;
  let currentHTML = "";
  const validationHistory: ValidationResult[] = [];

  for (let i = 0; i < maxIterations; i++) {
    if (i === 0) {
      const prompt = buildPrompt("compose", context);
      const result = await generateText({
        model: config.model,
        system: prompt.system,
        prompt: prompt.user,
        maxTokens: config.maxOutputTokens ?? 16000
      });
      currentHTML = extractHTML(result.text);
    } else {
      const lastErrors = validationHistory[validationHistory.length - 1];
      const fixPrompt = buildFixPrompt(currentHTML, lastErrors);
      const result = await generateText({
        model: config.model,
        system: fixPrompt.system,
        prompt: fixPrompt.user,
        maxTokens: config.maxOutputTokens ?? 16000
      });
      currentHTML = extractHTML(result.text);
    }

    const validation = await runValidators(currentHTML, context.designSystem);
    validationHistory.push(validation);

    if (validation.errors.length === 0) {
      return {
        html: currentHTML,
        iterations: i + 1,
        validationHistory,
        composedComponents: extractComposedComponents(currentHTML)
      };
    }
  }

  return {
    html: currentHTML,
    iterations: maxIterations,
    validationHistory,
    composedComponents: extractComposedComponents(currentHTML)
  };
}
```

Expected impact: validators should catch token compliance issues, native element misuse, CSS/HTML conflicts, class naming drift, template drift, and accessibility issues before human review.

## Implementation: Provider Abstraction

### Why Provider-Agnostic

Different phases may benefit from different models, local models may be required for offline work, and the best available model changes over time.

```ts
// packages/ai-orchestrator/src/provider.ts
import { createOpenAI } from "@ai-sdk/openai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { LanguageModel } from "ai";

export type ProviderConfig = {
  provider: "openai" | "anthropic" | "azure-openai" | "ollama";
  model: string;
  apiKey?: string;
  baseURL?: string;
  temperature?: number;
  maxTokens?: number;
};

export function createModel(config: ProviderConfig): LanguageModel {
  switch (config.provider) {
    case "openai":
      return createOpenAI({
        apiKey: config.apiKey ?? process.env.OPENAI_API_KEY,
        baseURL: config.baseURL
      })(config.model);
    case "anthropic":
      return createAnthropic({
        apiKey: config.apiKey ?? process.env.ANTHROPIC_API_KEY
      })(config.model);
    case "azure-openai":
      return createOpenAI({
        apiKey: config.apiKey ?? process.env.AZURE_OPENAI_API_KEY,
        baseURL: config.baseURL ?? process.env.AZURE_OPENAI_ENDPOINT
      })(config.model);
    case "ollama":
      return createOpenAI({
        apiKey: "ollama",
        baseURL: config.baseURL ?? "http://localhost:11434/v1"
      })(config.model);
  }
}
```

### Configuration

```yaml
# config/ai.yaml
provider: openai
model: gpt-4o
temperature: 0.2
maxOutputTokens: 32000
maxContextTokens: 100000
maxValidationIterations: 3

phases:
  shell:
    model: gpt-4o
    temperature: 0.1
  compose:
    model: gpt-4o
    maxOutputTokens: 32000
  wire:
    model: gpt-4o-mini
    temperature: 0.1
  fix:
    model: gpt-4o-mini
    temperature: 0.0
```

## Implementation: Learning Loop

Corrections captured by the feedback loop become AI context for future prototypes.

```ts
// packages/ai-orchestrator/src/learning-loader.ts
export async function loadRelevantCorrections(
  prototypeName: string,
  config: SystemConfig
): Promise<RelevantCorrections> {
  const allLogs = await loadAllLearningLogs(config);

  const directCorrections = allLogs
    .find((log) => log.prototype === prototypeName)
    ?.iterations
    .flatMap((iter) => iter.component_corrections ?? []) ?? [];

  const crossCorrections = aggregateCorrections(allLogs)
    .filter((correction) => correction.frequency >= config.feedback.promotionThreshold);

  const promotedPatterns = await loadPromotedPatterns(config);

  return {
    relevantCorrections: [
      ...promotedPatterns.map((p) => ({ ...p, source: "promoted" as const })),
      ...crossCorrections.map((c) => ({ ...c, source: "cross-prototype" as const })),
      ...directCorrections.map((c) => ({ ...c, source: "direct" as const }))
    ]
  };
}
```

## Implementation: Structured Output With Zod

Use structured output for tasks such as AI-assisted shell selection.

```ts
import { generateObject } from "ai";
import { z } from "zod";

const ShellSelectionSchema = z.object({
  selectedTemplate: z.string(),
  reason: z.string(),
  viewStates: z.array(z.object({
    name: z.string(),
    requiresNavigation: z.boolean(),
    navigationType: z.enum([
      "sidebar-flat",
      "sidebar-accordion",
      "horizontal-tabs"
    ]),
    matchedTemplate: z.string().optional()
  })),
  warnings: z.array(z.string()).optional()
});
```

This makes template selection structured, validated, and auditable.

## Implementation: CLI Integration

### `proto generate`

```ts
// packages/cli/src/commands/generate.ts
import { Command } from "commander";

export const generateCommand = new Command("generate")
  .description("AI-assisted prototype generation with validation loop")
  .argument("<name>", "Prototype name")
  .option("--phase <phase>", "Generation phase: shell, compose, wire, all", "all")
  .option("--provider <provider>", "AI provider override")
  .option("--model <model>", "Model override")
  .option("--max-iterations <n>", "Max validation iterations", "3")
  .option("--dry-run", "Show assembled context without generating")
  .action(async (name, opts) => {
    const config = await loadConfig();
    const context = await assembleContext(name, opts.phase, config);

    if (opts.dryRun) {
      console.log(JSON.stringify(context, null, 2));
      return;
    }

    const result = await generateWithValidation(context, {
      model: createModel(config.ai),
      maxValidationIterations: Number.parseInt(opts.maxIterations, 10),
      ...config.ai
    });

    writeFileSync(`prototypes/${name}.html`, result.html);
  });
```

### `proto feedback apply`

Apply user corrections with auto-categorization.

```ts
// packages/cli/src/commands/feedback-apply.ts
export const feedbackApplyCommand = new Command("apply")
  .description("Apply user correction and log it")
  .option("--element <selector>", "CSS selector of the element to change")
  .action(async (opts) => {
    const correction = await categorizeCorrection(
      opts.feedback,
      await readRelevantContext(opts.prototype, opts.element),
      config
    );

    const result = await applyCorrection(opts.prototype, correction, config);
    await logCorrection(opts.prototype, correction);

    const candidates = await checkPromotionCandidates(correction, config);
    if (candidates.length > 0) {
      console.log("Promotion candidates detected:");
      candidates.forEach((candidate) => {
        console.log(
          `"${candidate.original}" -> "${candidate.correctedTo}" (${candidate.frequency} occurrences)`
        );
      });
    }
  });
```

## Implementation: Agent Mode

Replace monolithic `AGENTS.md` routing with machine-readable agent configuration.

```yaml
# config/agent.yaml
name: proto-system-agent
version: "1.0"

capabilities:
  - read_files
  - write_prototypes
  - run_validators
  - log_corrections
  - query_registry

constraints:
  - never_modify_templates
  - never_modify_guidelines
  - never_hardcode_tokens
  - never_compose_without_flag
  - single_file_output

context_loading:
  order:
    - config/design-system.yaml
    - patterns/registry.json
  per_prototype:
    - requirements/specs/{name}.yaml
    - logs/{name}.yaml
  per_phase:
    shell:
      - templates/{matched_template}
    compose:
      - patterns/manifests/{matched_patterns}
      - config/components/*.yaml
    wire:
      - requirements/specs/{name}.yaml

validation:
  after_shell:
    - template-fidelity
  after_compose:
    - token-compliance
    - native-element-check
    - pattern-adherence
    - class-naming
  after_wire:
    - css-html-conflicts
    - accessibility
    - semantic-structure
  before_delivery:
    - all
```

## How This Addresses DUPS AI-Specific Problems

| DUPS Problem | AI Orchestrator Solution |
| --- | --- |
| AI holds too much context and loses important details | Context budget management prioritizes templates and patterns |
| AI composes components from scratch | Matched patterns are injected directly into the prompt |
| Corrections are lost in chat history | Learning logs are auto-loaded into AI context |
| Validation happens after human review | Validation loop catches errors before human review |
| AI self-interprets routing logic from Markdown | Machine-readable `agent.yaml` drives deterministic context |
| Single monolithic prompt | Phase-specific prompt templates |
| Locked to one provider | Provider abstraction through Vercel AI SDK |
| No structured output for decisions | `generateObject` with Zod schemas |

## Recommended Open Source Stack Summary

| Component | Library | Why |
| --- | --- | --- |
| AI provider abstraction | Vercel AI SDK | Supports OpenAI, Anthropic, local models, streaming, tools, and TypeScript-first APIs |
| Token counting | `tiktoken` | Accurate token budgets for context management |
| Prompt templates | Handlebars | Simple interpolation and already used in the ecosystem |
| Schema validation | Zod | Consistent with Layers 1-6 |
| Configuration | YAML | Human-readable and already used elsewhere |

Total new dependencies:

- `ai`
- `@ai-sdk/openai`
- `tiktoken`
- `handlebars`

Optional:

- `@ai-sdk/anthropic`

## Implementation Roadmap Addition

Insert this between the existing Phase 3 and Phase 4.

### Phase 3.5: AI Orchestrator (Weeks 7-9)

1. **Week 7:** context assembler, context budget management, and prompt templates for all three phases.
2. **Week 8:** provider abstraction and basic `proto generate` CLI command.
3. **Week 9:** validation loop integration and `proto feedback apply`.

Milestone: `proto generate my-feature --phase compose` produces a validated prototype with zero token-compliance errors and zero native-element errors within three iterations.

Testing strategy:

- Unit tests for context assembly.
- Integration tests for a full generate cycle against a test BRD.
- Snapshot tests confirming that the same BRD, config, and low temperature produce structurally consistent output.

## Cost Considerations

### Token Usage Estimates

| Phase | Input Tokens | Output Tokens | Iterations | Total |
| --- | ---: | ---: | ---: | ---: |
| Shell selection | ~5,000 | ~500 | 1 | ~5,500 |
| Composition | ~30,000 | ~15,000 | 1-3 | ~75,000 |
| Behavior wiring | ~20,000 | ~10,000 | 2 | ~60,000 |
| Total per prototype |  |  |  | ~200,000 |

Estimated cost:

- GPT-4o: roughly $1.50 per prototype generation including validation loop.
- GPT-4o-mini: roughly $0.12 per prototype generation for fix phases.

Recommendation: use GPT-4o for initial composition and GPT-4o-mini for validation fixes. Estimated blended cost: roughly $0.80-$1.20 per prototype.

## Summary: What Changes For The User

### Before: DUPS + Codex CLI

```text
User writes BRD
-> User tells AI to read AGENTS.md and generate a prototype
-> AI reads many files and generates from scratch
-> User reviews and finds many issues
-> User gives one correction at a time
-> Many cycles later, output is close but still imperfect
```

### After: Proto System + AI Orchestrator

```text
User writes BRD
-> proto intake parse my-brd.md
-> proto intake approve
-> proto generate my-feature
   - context assembled from templates, registry patterns, tokens, and corrections
   - AI generates shell, composition, and behavior
   - validators run between generation rounds
   - errors are auto-fixed before review
-> user reviews output
-> proto feedback apply --feedback "change X to Y"
-> correction is categorized, logged, and reused
```

Net effect: reduce correction cycles from roughly 40 to roughly 5-8, while each correction permanently improves the system.

