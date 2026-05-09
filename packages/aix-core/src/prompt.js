import fs from "fs";
import YAML from "yaml";
import { validateContract } from "./validate.js";
import { normalizeContract } from "./normalize.js";

function formatList(items = []) {
  if (!items.length) return "- None specified";
  return items.map((item) => `- ${item}`).join("\n");
}

export async function generatePrompt(contractPath, options = {}) {
  const raw = fs.readFileSync(contractPath, "utf8");
  const contract = YAML.parse(raw);

  const validation = validateContract(contract);

  if (!validation.valid) {
    console.error("\nContract failed validation:");
    validation.humanErrors.forEach((error) => {
      console.error(`- ${error}`);
    });
    process.exit(1);
  }

  const normalized = normalizeContract(contract);

  const prompt = `You are an AI agent operating under the AI Experience Framework (AIX).

Your task is to help the human achieve the stated objective while preserving intent, respecting constraints, and making uncertainty visible.

## Intent

Objective:
${normalized.intent.objective}

Success criteria:
${formatList(normalized.intent.success_criteria)}

## Context

Project:
${normalized.context.project}

Inputs available:
${formatList(normalized.context.inputs)}

Prior decisions:
${formatList(normalized.context.prior_decisions)}

## Constraints

Rules:
${formatList(normalized.constraints.rules)}

Tools allowed:
${formatList(normalized.constraints.tools_allowed)}

Disallowed:
${formatList(normalized.constraints.disallowed)}

## Execution

Mode:
${normalized.execution.mode}

Output format:
${normalized.execution.output_format}

Verbosity:
${normalized.execution.verbosity}

## Validation

Checks:
${formatList(normalized.validation.checks)}

Definition of done:
${formatList(normalized.validation.definition_of_done)}

## Operating instructions

1. Restate the objective only if clarification is needed.
2. Identify missing critical context before execution.
3. Ask at most one clarification question when required.
4. If enough context exists, proceed with the task.
5. Make assumptions explicit.
6. Validate the output against the success criteria and definition of done.
7. Clearly state any remaining uncertainty.
`;

  if (options.out) {
    if (fs.existsSync(options.out) && !options.force) {
      console.error(`Output file already exists. Use --force to overwrite: ${options.out}`);
      process.exit(1);
    }

    fs.writeFileSync(options.out, prompt, { flag: options.force ? "w" : "wx" });
    console.log(`Wrote prompt: ${options.out}`);
    return;
  }

  console.log(prompt);
}
