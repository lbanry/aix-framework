import { spawnSync } from "node:child_process";
import assert from "node:assert/strict";
import fs from "node:fs";

function run(args, options = {}) {
  return spawnSync("node", args, {
    cwd: new URL("..", import.meta.url),
    encoding: "utf8",
    ...options
  });
}

function assertSuccess(args, expectedOutput) {
  const result = run(args);
  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.match(result.stdout, expectedOutput);
}

function assertFailure(args, expectedOutput) {
  const result = run(args);
  assert.notEqual(result.status, 0, "Expected command to fail.");
  assert.match(`${result.stdout}\n${result.stderr}`, expectedOutput);
}

assertSuccess(
  ["./src/cli.js", "inspect", "packages/aix-core/examples/project-contract.yaml"],
  /Contract readiness: 100\/100/
);

assertSuccess(
  ["./src/cli.js", "inspect", "packages/aix-core/examples/research-contract.yaml"],
  /Strong contract/
);

assertSuccess(
  ["./src/cli.js", "inspect", "packages/aix-core/tests/fixtures/strong-contract.yaml"],
  /Suggested Improvements\n- None\./
);

assertSuccess(
  ["./src/cli.js", "inspect", "packages/aix-core/tests/fixtures/weak-contract.yaml"],
  /warning\(s\) found/
);

assertFailure(
  ["./src/cli.js", "inspect", "packages/aix-core/tests/fixtures/invalid-contract.yaml"],
  /intent\.objective must not be empty/
);

const jsonInspect = run(["./src/cli.js", "inspect", "packages/aix-core/examples/project-contract.yaml", "--json"]);
assert.equal(jsonInspect.status, 0, jsonInspect.stderr || jsonInspect.stdout);
const inspection = JSON.parse(jsonInspect.stdout);
assert.equal(inspection.valid, true);
assert.equal(inspection.readinessScore, 100);

assertSuccess(
  ["./src/cli.js", "prompt", "packages/aix-core/examples/research-contract.yaml"],
  /Analyze source material to produce a concise research summary/
);

const promptOut = new URL("./tmp-prompt-output.md", import.meta.url);
if (fs.existsSync(promptOut)) {
  fs.unlinkSync(promptOut);
}

assertSuccess(
  ["./src/cli.js", "prompt", "packages/aix-core/examples/research-contract.yaml", "--out", "tests/tmp-prompt-output.md"],
  /Wrote prompt: tests\/tmp-prompt-output\.md/
);
assert.match(
  fs.readFileSync(promptOut, "utf8"),
  /Analyze source material to produce a concise research summary/
);
fs.unlinkSync(promptOut);

assertSuccess(
  ["./src/cli.js", "run", "packages/aix-core/examples/project-contract.yaml"],
  /AIX Execution Preparation[\s\S]*Prepared Prompt/
);

assertSuccess(
  ["./src/cli.js", "interface", "inspect-system", "packages/aix-design/interface/systems/aix-interface-system.yaml"],
  /Interface system is ready for orchestration/
);

const importedDesignSystemPath = new URL("./tmp-imported-design-system.yaml", import.meta.url);
if (fs.existsSync(importedDesignSystemPath)) {
  fs.unlinkSync(importedDesignSystemPath);
}

assertSuccess(
  [
    "./src/cli.js",
    "interface",
    "import-design-md",
    "packages/aix-design/tests/fixtures/shopify-design.md",
    "--name",
    "Imported Shopify Test System",
    "--pattern-id",
    "imported_shopify_test_flow",
    "--out",
    "tests/tmp-imported-design-system.yaml"
  ],
  /Wrote interface system: tests\/tmp-imported-design-system\.yaml/
);

assertSuccess(
  ["./src/cli.js", "interface", "inspect-system", "tests/tmp-imported-design-system.yaml"],
  /Imported Shopify Test System[\s\S]*Interface system is ready for orchestration/
);
fs.unlinkSync(importedDesignSystemPath);

const richDesignSystemPath = new URL("./tmp-rich-design-system.yaml", import.meta.url);
if (fs.existsSync(richDesignSystemPath)) {
  fs.unlinkSync(richDesignSystemPath);
}

assertSuccess(
  [
    "./src/cli.js",
    "interface",
    "import-design-md",
    "packages/aix-design/tests/fixtures/rich-design.md",
    "--name",
    "Rich Design Test System",
    "--pattern-id",
    "rich_design_test_flow",
    "--out",
    "tests/tmp-rich-design-system.yaml"
  ],
  /Wrote interface system: tests\/tmp-rich-design-system\.yaml/
);

const richDesignSystem = fs.readFileSync(richDesignSystemPath, "utf8");
assert.match(richDesignSystem, /source:\n\s+type: design-md/);
assert.match(richDesignSystem, /philosophy:/);
assert.match(richDesignSystem, /brand_personality:/);
assert.match(richDesignSystem, /content_tone:/);
assert.match(richDesignSystem, /generation_constraints:/);
assert.match(richDesignSystem, /render:/);
assert.match(richDesignSystem, /element: button/);
assert.match(richDesignSystem, /variant: primary-action/);

assertSuccess(
  ["./src/cli.js", "interface", "inspect-system", "tests/tmp-rich-design-system.yaml"],
  /Rich Design Test System[\s\S]*Interface system is ready for orchestration/
);
fs.unlinkSync(richDesignSystemPath);

const interfacePlan = run([
  "./src/cli.js",
  "interface",
  "plan",
  "packages/aix-design/interface/requirements/contract-inspection.yaml",
  "--system",
  "packages/aix-design/interface/systems/aix-interface-system.yaml",
  "--research",
  "packages/aix-design/interface/research/aix-findings.yaml"
]);
assert.equal(interfacePlan.status, 0, interfacePlan.stderr || interfacePlan.stdout);
assert.match(interfacePlan.stdout, /screen_id: contract-inspection-review/);
assert.match(interfacePlan.stdout, /ReadinessScore/);

assertSuccess(
  ["./src/cli.js", "interface", "inspect-plan", "packages/aix-design/interface/plans/contract-inspection.plan.yaml"],
  /Overall score: 100\/100[\s\S]*Interface plan is ready for prompt generation/
);

assertSuccess(
  ["./src/cli.js", "interface", "prompt", "packages/aix-design/interface/plans/contract-inspection.plan.yaml"],
  /Do not invent layout, components, or interactions/
);

assertSuccess(
  ["./src/cli.js", "interface", "inspect-plan", "packages/aix-design/interface/plans/paperclip-landing.plan.yaml"],
  /Overall score: 100\/100[\s\S]*Interface plan is ready for prompt generation/
);

assertSuccess(
  ["./src/cli.js", "interface", "inspect-system", "packages/aix-design/interface/systems/carbon-marketing-system.yaml"],
  /Interface system is ready for orchestration/
);

assertSuccess(
  ["./src/cli.js", "interface", "inspect-plan", "packages/aix-design/interface/plans/paperclip-carbon-landing.plan.yaml"],
  /Overall score: 100\/100[\s\S]*Interface plan is ready for prompt generation/
);

assertSuccess(
  ["./src/cli.js", "interface", "inspect-plan", "packages/aix-design/interface/plans/navery-graduation-poster-mvp.plan.yaml"],
  /Overall score: 100\/100[\s\S]*Interface plan is ready for prompt generation/
);

const invalidInterfacePlanPath = new URL("./tmp-invalid-interface-plan.yaml", import.meta.url);
fs.writeFileSync(invalidInterfacePlanPath, `screen_id: contract-inspection-review
user_goal: Review readiness.
task_type: validation_review
system: AIX Interface System
research_sources: []
sections: []
gaps: []
validation_checks:
  - Check readiness.
generation_boundary: Do not invent UI.
`);

assertFailure(
  ["./src/cli.js", "interface", "inspect-plan", "tests/tmp-invalid-interface-plan.yaml"],
  /sections must contain at least 1 item/
);
fs.unlinkSync(invalidInterfacePlanPath);

const missingComponentSystemPath = new URL("./tmp-missing-component-system.yaml", import.meta.url);
fs.writeFileSync(missingComponentSystemPath, `name: Incomplete AIX Interface System
version: 0.1.0
tokens:
  color:
    - status.pass
  spacing:
    - regular
components:
  - id: ReadinessScore
    purpose: Show readiness.
    supports:
      - readiness_score
    rules:
      - Show readiness first.
patterns:
  - id: inspection_results
    purpose: Review inspection results.
    use_when:
      - validation_review
    required_components:
      - ReadinessScore
      - ValidationStatus
    information_order:
      - readiness_score
      - schema_errors
    rules:
      - Use approved components only.
accessibility_rules:
  - Do not rely on color alone.
`);

const gapPlan = run([
  "./src/cli.js",
  "interface",
  "plan",
  "packages/aix-design/interface/requirements/contract-inspection.yaml",
  "--system",
  "tests/tmp-missing-component-system.yaml",
  "--research",
  "packages/aix-design/interface/research/aix-findings.yaml"
]);
assert.equal(gapPlan.status, 0, gapPlan.stderr || gapPlan.stdout);
assert.match(gapPlan.stdout, /No approved component supports required information 'schema_errors'/);
assert.match(gapPlan.stdout, /severity: blocking/);
assert.doesNotMatch(gapPlan.stdout, /\n\s+- ValidationStatus/);
fs.unlinkSync(missingComponentSystemPath);

const prototypeOut = new URL("./tmp-contract-prototype", import.meta.url);
if (fs.existsSync(prototypeOut)) {
  fs.rmSync(prototypeOut, { recursive: true, force: true });
}

assertSuccess(
  [
    "./src/cli.js",
    "interface",
    "prototype",
    "scaffold",
    "packages/aix-design/interface/plans/contract-inspection.plan.yaml",
    "--system",
    "packages/aix-design/interface/systems/aix-interface-system.yaml",
    "--out",
    "tests/tmp-contract-prototype"
  ],
  /Wrote prototype: tests\/tmp-contract-prototype[\s\S]*Validation: 0 error\(s\)/
);

const generatedManifest = JSON.parse(fs.readFileSync(new URL("./tmp-contract-prototype/prototype.json", import.meta.url), "utf8"));
assert.equal(generatedManifest.screen_id, "contract-inspection-review");
assert.equal(generatedManifest.source_plan, "packages/aix-design/interface/plans/contract-inspection.plan.yaml");
assert.equal(generatedManifest.source_system, "packages/aix-design/interface/systems/aix-interface-system.yaml");
assert.equal(generatedManifest.sections.length, 5);
assert.ok(generatedManifest.validation_rules.includes("prototype.design.component-approved"));
assert.equal(generatedManifest.sections[0].render[0].component, "ReadinessScore");
assert.equal(generatedManifest.sections[0].render[0].element, "aside");
assert.equal(generatedManifest.sections[0].render[0].emphasis, "status");

const generatedHtml = fs.readFileSync(new URL("./tmp-contract-prototype/index.html", import.meta.url), "utf8");
assert.match(generatedHtml, /data-aix-screen="contract-inspection-review"/);
assert.match(generatedHtml, /data-aix-section="readiness-score"/);
assert.match(generatedHtml, /data-aix-component="ReadinessScore"/);
assert.match(generatedHtml, /data-aix-render-element="aside"/);
assert.match(generatedHtml, /data-aix-render-emphasis="status"/);
assert.match(generatedHtml, /class="aix-rendered-component/);

const prototypeVerify = run([
  "./src/cli.js",
  "interface",
  "prototype",
  "verify",
  "tests/tmp-contract-prototype",
  "--plan",
  "packages/aix-design/interface/plans/contract-inspection.plan.yaml",
  "--system",
  "packages/aix-design/interface/systems/aix-interface-system.yaml",
  "--json"
]);
assert.equal(prototypeVerify.status, 0, prototypeVerify.stderr || prototypeVerify.stdout);
const prototypeReport = JSON.parse(prototypeVerify.stdout);
assert.equal(prototypeReport.valid, true);
assert.equal(prototypeReport.summary.errors, 0);
assert.equal(prototypeReport.summary.warnings, 0);

const sourceTracedSystemPath = new URL("./tmp-source-traced-system.yaml", import.meta.url);
fs.writeFileSync(sourceTracedSystemPath, `name: Source Traced AIX Interface System
version: 0.1.0
source:
  type: design-md
  path: packages/aix-design/tests/fixtures/rich-design.md
  imported_at: "2026-05-10T00:00:00.000Z"
philosophy:
  - Calm operational clarity over decorative novelty.
brand_personality:
  - Professional but approachable.
content_tone:
  - Concise, direct, professional, and supportive.
interaction_rules:
  - Confirm destructive actions.
motion_rules:
  - Avoid decorative animation.
generation_constraints:
  - Never introduce random gradients.
examples:
  - Good dashboards have clear hierarchy.
tokens:
  color:
    - status.pass
    - status.warning
    - status.error
    - surface.default
    - text.primary
  spacing:
    - compact
    - regular
    - section
components:
  - id: ReadinessScore
    purpose: Show readiness.
    supports:
      - readiness_score
    rules:
      - Show readiness first.
  - id: ValidationStatus
    purpose: Show validation.
    supports:
      - schema_errors
    rules:
      - Show failures before optional suggestions.
  - id: WarningList
    purpose: Show warnings.
    supports:
      - warnings
    rules:
      - Keep warnings separate from suggestions.
  - id: SuggestionList
    purpose: Show suggestions.
    supports:
      - suggestions
    rules:
      - Do not present optional suggestions as blockers.
  - id: ActionBar
    purpose: Present next actions.
    supports:
      - next_actions
    rules:
      - Actions must follow the inspection summary.
patterns:
  - id: inspection_results
    purpose: Review inspection results.
    use_when:
      - validation_review
    required_components:
      - ReadinessScore
      - ValidationStatus
      - WarningList
      - SuggestionList
      - ActionBar
    information_order:
      - readiness_score
      - schema_errors
      - warnings
      - suggestions
      - next_actions
    rules:
      - Use approved components only.
accessibility_rules:
  - Do not rely on color alone.
`);

const tracedPrototypeOut = new URL("./tmp-traced-prototype", import.meta.url);
if (fs.existsSync(tracedPrototypeOut)) {
  fs.rmSync(tracedPrototypeOut, { recursive: true, force: true });
}

assertSuccess(
  [
    "./src/cli.js",
    "interface",
    "prototype",
    "scaffold",
    "packages/aix-design/interface/plans/contract-inspection.plan.yaml",
    "--system",
    "tests/tmp-source-traced-system.yaml",
    "--out",
    "tests/tmp-traced-prototype"
  ],
  /Wrote prototype: tests\/tmp-traced-prototype[\s\S]*Validation: 0 error\(s\)/
);

const tracedManifest = JSON.parse(fs.readFileSync(new URL("./tmp-traced-prototype/prototype.json", import.meta.url), "utf8"));
assert.equal(tracedManifest.design_source.path, "packages/aix-design/tests/fixtures/rich-design.md");
assert.match(JSON.stringify(tracedManifest.design_context), /Calm operational clarity/);

const prototypeContextPath = new URL("./tmp-prototype-context.json", import.meta.url);
if (fs.existsSync(prototypeContextPath)) {
  fs.unlinkSync(prototypeContextPath);
}

assertSuccess(
  [
    "./src/cli.js",
    "interface",
    "prototype",
    "context",
    "packages/aix-design/interface/plans/contract-inspection.plan.yaml",
    "--system",
    "tests/tmp-source-traced-system.yaml",
    "--prototype",
    "tests/tmp-traced-prototype",
    "--out",
    "tests/tmp-prototype-context.json"
  ],
  /Wrote prototype context: tests\/tmp-prototype-context\.json/
);

const prototypeContext = JSON.parse(fs.readFileSync(prototypeContextPath, "utf8"));
assert.equal(prototypeContext.generation_mode, "deterministic-context");
assert.equal(prototypeContext.ai_boundary.model_calls, false);
assert.equal(prototypeContext.sources.validation_report, "tests/tmp-traced-prototype/validation-report.json");
assert.equal(prototypeContext.validation_report.valid, true);
assert.equal(prototypeContext.prototype_manifest.screen_id, "contract-inspection-review");
assert.equal(prototypeContext.design_markdown.available, true);
assert.match(prototypeContext.design_markdown.sections.design_philosophy, /Calm operational clarity/);
fs.unlinkSync(prototypeContextPath);

const tracedHtmlPath = new URL("./tmp-traced-prototype/index.html", import.meta.url);
const originalTracedHtml = fs.readFileSync(tracedHtmlPath, "utf8");

fs.writeFileSync(
  tracedHtmlPath,
  originalTracedHtml.replace("</style>", ".bad-gradient { background: linear-gradient(red, blue); }\n</style>")
);

const gradientVerify = run([
  "./src/cli.js",
  "interface",
  "prototype",
  "verify",
  "tests/tmp-traced-prototype",
  "--plan",
  "packages/aix-design/interface/plans/contract-inspection.plan.yaml",
  "--system",
  "tests/tmp-source-traced-system.yaml",
  "--json"
]);
assert.notEqual(gradientVerify.status, 0, "Expected gradient constraint verification to fail.");
const gradientReport = JSON.parse(gradientVerify.stdout);
assert.equal(gradientReport.valid, false);
assert.ok(gradientReport.findings.some((finding) => {
  return finding.rule_id === "prototype.design.constraint-followed"
    && finding.category === "design"
    && /Remove gradient CSS/.test(finding.suggested_fix);
}));

fs.writeFileSync(
  tracedHtmlPath,
  originalTracedHtml.replace("</style>", ".bad-token { color: var(--aix-color-unknown); }\n</style>")
);

const unknownTokenVerify = run([
  "./src/cli.js",
  "interface",
  "prototype",
  "verify",
  "tests/tmp-traced-prototype",
  "--plan",
  "packages/aix-design/interface/plans/contract-inspection.plan.yaml",
  "--system",
  "tests/tmp-source-traced-system.yaml",
  "--json"
]);
assert.notEqual(unknownTokenVerify.status, 0, "Expected unknown token verification to fail.");
const unknownTokenReport = JSON.parse(unknownTokenVerify.stdout);
assert.ok(unknownTokenReport.findings.some((finding) => {
  return finding.rule_id === "prototype.tokens.no-unknown-token"
    && finding.category === "tokens"
    && /Replace the token reference/.test(finding.suggested_fix);
}));

fs.rmSync(tracedPrototypeOut, { recursive: true, force: true });
fs.unlinkSync(sourceTracedSystemPath);

const invalidRenderSystemPath = new URL("./tmp-invalid-render-system.yaml", import.meta.url);
fs.writeFileSync(invalidRenderSystemPath, `name: Invalid Render AIX Interface System
version: 0.1.0
tokens:
  color:
    - status.pass
    - status.warning
    - status.error
    - surface.default
    - text.primary
  spacing:
    - compact
    - regular
    - section
components:
  - id: ReadinessScore
    purpose: Show readiness.
    supports:
      - readiness_score
    render:
      element: marquee
      label_style: heading
      emphasis: secondary
    rules:
      - Show readiness first.
  - id: ValidationStatus
    purpose: Show validation.
    supports:
      - schema_errors
    rules:
      - Show failures before optional suggestions.
  - id: WarningList
    purpose: Show warnings.
    supports:
      - warnings
    rules:
      - Keep warnings separate from suggestions.
  - id: SuggestionList
    purpose: Show suggestions.
    supports:
      - suggestions
    rules:
      - Do not present optional suggestions as blockers.
  - id: ActionBar
    purpose: Present next actions.
    supports:
      - next_actions
    rules:
      - Actions must follow the inspection summary.
patterns:
  - id: inspection_results
    purpose: Review inspection results.
    use_when:
      - validation_review
    required_components:
      - ReadinessScore
      - ValidationStatus
      - WarningList
      - SuggestionList
      - ActionBar
    information_order:
      - readiness_score
      - schema_errors
      - warnings
      - suggestions
      - next_actions
    rules:
      - Use approved components only.
accessibility_rules:
  - Do not rely on color alone.
`);

const invalidRenderOut = new URL("./tmp-invalid-render-prototype", import.meta.url);
if (fs.existsSync(invalidRenderOut)) {
  fs.rmSync(invalidRenderOut, { recursive: true, force: true });
}

const invalidRenderScaffold = run([
  "./src/cli.js",
  "interface",
  "prototype",
  "scaffold",
  "packages/aix-design/interface/plans/contract-inspection.plan.yaml",
  "--system",
  "tests/tmp-invalid-render-system.yaml",
  "--out",
  "tests/tmp-invalid-render-prototype"
]);
assert.notEqual(invalidRenderScaffold.status, 0, "Expected invalid render scaffold to fail.");
const invalidRenderReport = JSON.parse(fs.readFileSync(new URL("./tmp-invalid-render-prototype/validation-report.json", import.meta.url), "utf8"));
assert.ok(invalidRenderReport.findings.some((finding) => {
  return finding.rule_id === "prototype.render.element-allowed"
    && finding.category === "render"
    && /Use one of:/.test(finding.suggested_fix);
}));

fs.rmSync(invalidRenderOut, { recursive: true, force: true });
fs.unlinkSync(invalidRenderSystemPath);

assertFailure(
  [
    "./src/cli.js",
    "interface",
    "prototype",
    "scaffold",
    "packages/aix-design/interface/plans/contract-inspection.plan.yaml",
    "--system",
    "packages/aix-design/interface/systems/aix-interface-system.yaml",
    "--out",
    "tests/tmp-contract-prototype"
  ],
  /Output directory already exists/
);

fs.rmSync(prototypeOut, { recursive: true, force: true });

console.log("AIX smoke tests passed.");
