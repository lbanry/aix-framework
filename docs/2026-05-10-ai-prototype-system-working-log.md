# AI Prototype System Working Log

Date: 2026-05-10

## Context

User provided 34 JPEG images in:

```text
/Users/lincolnbanry/Documents/AIX/aix-framework/image-references
```

The images are photos of a Markdown document titled:

```text
open-source-prototype-system-implementation-guide.md
```

The document describes a design-system-agnostic prototype generation system implemented as a Node.js / TypeScript monorepo.

## OCR Work

Local OCR checks performed:

- `tesseract` was not installed.
- `ocrmypdf`, ImageMagick `magick`, and `convert` were not installed.
- A temporary macOS Vision OCR Swift script was attempted from `/private/tmp/aix_vision_ocr.swift`.
- Swift initially failed because its module cache tried to write under the home cache directory.
- Rerunning Swift with `CLANG_MODULE_CACHE_PATH=/private/tmp/aix-clang-module-cache` worked at the compiler/runtime level, but Vision OCR returned `nilError` for all JPEGs in this sandbox.
- The images were then reviewed directly rather than producing a full OCR transcript.

Reusable Tesseract script added:

```text
/Users/lincolnbanry/Documents/AIX/aix-framework/scripts/ocr-image-references.sh
```

Run from the repo:

```bash
cd /Users/lincolnbanry/Documents/AIX/aix-framework
brew install tesseract
scripts/ocr-image-references.sh
```

Default output:

```text
/Users/lincolnbanry/Documents/AIX/aix-framework/image-references/ocr-output.md
```

The script supports:

```bash
scripts/ocr-image-references.sh [IMAGE_DIR] [OUTPUT_FILE]
```

It OCRs `.jpg`, `.jpeg`, `.png`, `.tif`, and `.tiff` files with `tesseract --psm 6`, adding filename separators to the output.

If OCR quality is poor, try `--psm 4`, `--psm 11`, or `--psm 12` in the script.

## Extracted System Plan

The proposed system has 7 layers:

1. Requirements Engine
   - Parses Markdown BRDs.
   - Extracts acceptance criteria, fields, flows, view-state maps, and phase plans.

2. Design System Adapter
   - Ingests tokens from Style Dictionary, Figma, Tokens Studio exports, CSS variables, and related sources.
   - Generates semantic token maps and validator rules.

3. Pattern Library
   - Maintains a typed registry of canonical UI patterns.
   - Tracks semantic roles, slot types, manifests, and promotion rules.

4. Generation Engine
   - Three-phase generation:
     - Shell selection.
     - Component composition.
     - Behavior wiring.
   - Uses Nunjucks, Cheerio, jsdom, templates, config, and pattern registry lookups.

5. Validation Engine
   - Pluggable validators for:
     - Token compliance.
     - Template fidelity.
     - Pattern adherence.
     - CSS conflicts.
     - Accessibility.
     - Semantic HTML.
     - Native element usage.
     - Class naming.

6. Feedback Loop
   - Structured learning logs.
   - Staleness detection.
   - Correction aggregation.
   - Promotion candidates.
   - Git hook integration.

7. CLI Tool: `proto`
   - Commander.js CLI.
   - Command groups include intake, generation, validation, feedback, design-system setup, and dev preview.

## Technical Stack Observed

Core runtime and tooling:

- Node.js >= 20 LTS.
- TypeScript 5.x.
- pnpm workspace.
- tsup or esbuild.
- Vitest.
- ESLint + Prettier.

Libraries mentioned:

- `unified`, `remark-parse`, `remark-gfm`, `remark-frontmatter`, `gray-matter`.
- `zod`, `yaml`, `ajv`, `fast-glob`.
- `style-dictionary`, `token-transformer`, `figma-js`, `node-fetch`.
- `nunjucks`, `cheerio`, `jsdom`.
- `postcss`, `stylelint`, `axe-core`, `htmlhint`, `css-tree`, `specificity`.
- `chokidar`, `simple-git`, `date-fns`.
- `commander`, `inquirer`, `chalk`, `ora`, `cli-table3`, `open`.
- `vite` for dev preview.

## Feedback Already Given

The architecture is directionally strong because it separates parsing, token ingestion, generation, validation, learning, and CLI concerns.

Main risk: scope. The document describes several products at once:

- BRD parser.
- Design-token adapter.
- Pattern registry.
- HTML generator.
- Validator suite.
- CLI.
- Dev server.
- Learning/promotion system.

Recommended MVP vertical slice:

```text
design-system config -> one BRD format -> one pattern registry -> generate one static HTML prototype -> validate token usage + accessibility
```

Recommended priorities:

- Treat the intermediate representation as the core product.
- Make the pattern registry human-authored first.
- Keep generation deterministic by default.
- Keep auto-promotion from feedback logs as a later feature.
- Start with fewer dependencies and add more as validators require them.
- Treat "design-system agnostic" as "design-system configurable" through a normalized schema.
- Make validators emit machine-readable findings with stable rule IDs, severity, file/selector/source location, and suggested fix.

Recommended early CLI commands:

```text
proto ds init
proto intake parse
proto scaffold
proto verify
proto dev
```

Defer correction promotion, full Git hook enforcement, and plugin ecosystems until the MVP is stable.

## Open Product Decisions

Need user decisions before implementation:

1. Should this system live inside the existing AIX framework repo or start as a separate project/package?
2. What is the first BRD format to support?
3. What is the first design-system source?
   - Style Dictionary JSON?
   - Figma variables?
   - CSS variables?
   - Existing AIX design package?
4. What are the first 3-5 prototype patterns?
5. Should generated prototypes be committed, kept local-only, or treated like current `prototypes/` policy?

Existing AIX memory says prototype artifacts are local-only by default unless explicitly approved.

## Current Git State Notes

At the time of this log, the following were untracked:

```text
.DS_Store
image-references/
scripts/
```

This working log is also newly added under:

```text
docs/2026-05-10-ai-prototype-system-working-log.md
```

Do not assume the images or generated OCR output should be committed. Ask the user first.

## Recommended Next Chat Starting Point

Suggested prompt for the next chat:

```text
Read /Users/lincolnbanry/Documents/AIX/aix-framework/docs/2026-05-10-ai-prototype-system-working-log.md and create a concrete MVP implementation plan for the design-system-agnostic prototype generation system. Keep existing AIX repo policy in mind: prototypes are local-only unless I explicitly approve committing them.
```

