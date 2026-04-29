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
  ["./src/cli.js", "inspect", "examples/project-contract.yaml"],
  /Contract readiness: 100\/100/
);

assertSuccess(
  ["./src/cli.js", "inspect", "examples/research-contract.yaml"],
  /Strong contract/
);

assertSuccess(
  ["./src/cli.js", "inspect", "tests/fixtures/strong-contract.yaml"],
  /Suggested Improvements\n- None\./
);

assertSuccess(
  ["./src/cli.js", "inspect", "tests/fixtures/weak-contract.yaml"],
  /warning\(s\) found/
);

assertFailure(
  ["./src/cli.js", "inspect", "tests/fixtures/invalid-contract.yaml"],
  /intent\.objective must not be empty/
);

const jsonInspect = run(["./src/cli.js", "inspect", "examples/project-contract.yaml", "--json"]);
assert.equal(jsonInspect.status, 0, jsonInspect.stderr || jsonInspect.stdout);
const inspection = JSON.parse(jsonInspect.stdout);
assert.equal(inspection.valid, true);
assert.equal(inspection.readinessScore, 100);

assertSuccess(
  ["./src/cli.js", "prompt", "examples/research-contract.yaml"],
  /Analyze source material to produce a concise research summary/
);

const promptOut = new URL("./tmp-prompt-output.md", import.meta.url);
if (fs.existsSync(promptOut)) {
  fs.unlinkSync(promptOut);
}

assertSuccess(
  ["./src/cli.js", "prompt", "examples/research-contract.yaml", "--out", "tests/tmp-prompt-output.md"],
  /Wrote prompt: tests\/tmp-prompt-output\.md/
);
assert.match(
  fs.readFileSync(promptOut, "utf8"),
  /Analyze source material to produce a concise research summary/
);
fs.unlinkSync(promptOut);

assertSuccess(
  ["./src/cli.js", "run", "examples/project-contract.yaml"],
  /AIX Execution Preparation[\s\S]*Prepared Prompt/
);

assertSuccess(
  ["./src/cli.js", "interface", "inspect-system", "interface/systems/aix-interface-system.yaml"],
  /Interface system is ready for orchestration/
);

const interfacePlan = run([
  "./src/cli.js",
  "interface",
  "plan",
  "interface/requirements/contract-inspection.yaml",
  "--system",
  "interface/systems/aix-interface-system.yaml",
  "--research",
  "interface/research/aix-findings.yaml"
]);
assert.equal(interfacePlan.status, 0, interfacePlan.stderr || interfacePlan.stdout);
assert.match(interfacePlan.stdout, /screen_id: contract-inspection-review/);
assert.match(interfacePlan.stdout, /ReadinessScore/);

assertSuccess(
  ["./src/cli.js", "interface", "inspect-plan", "interface/plans/contract-inspection.plan.yaml"],
  /Overall score: 100\/100[\s\S]*Interface plan is ready for prompt generation/
);

assertSuccess(
  ["./src/cli.js", "interface", "prompt", "interface/plans/contract-inspection.plan.yaml"],
  /Do not invent layout, components, or interactions/
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
  "interface/requirements/contract-inspection.yaml",
  "--system",
  "tests/tmp-missing-component-system.yaml",
  "--research",
  "interface/research/aix-findings.yaml"
]);
assert.equal(gapPlan.status, 0, gapPlan.stderr || gapPlan.stdout);
assert.match(gapPlan.stdout, /No approved component supports required information 'schema_errors'/);
assert.match(gapPlan.stdout, /severity: blocking/);
assert.doesNotMatch(gapPlan.stdout, /\n\s+- ValidationStatus/);
fs.unlinkSync(missingComponentSystemPath);

console.log("AIX smoke tests passed.");
