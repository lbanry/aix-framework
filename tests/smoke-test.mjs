import { spawnSync } from "node:child_process";
import assert from "node:assert/strict";

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

assertSuccess(
  ["./src/cli.js", "prompt", "examples/research-contract.yaml"],
  /Analyze source material to produce a concise research summary/
);

assertSuccess(
  ["./src/cli.js", "run", "examples/project-contract.yaml"],
  /AIX Execution Preparation[\s\S]*Prepared Prompt/
);

console.log("AIX smoke tests passed.");
