import fs from "fs";
import YAML from "yaml";
import { validateContract } from "./validate.js";
import { normalizeContract } from "./normalize.js";

function formatList(items = []) {
  if (!items.length) return "- None specified";
  return items.map((item) => `- ${item}`).join("\n");
}

function isWeakText(value = "") {
  const weakTerms = ["improve", "better", "optimize", "help", "stuff", "things", "good"];
  const lower = value.toLowerCase();

  return (
    value.trim().length < 20 ||
    weakTerms.some((term) => lower === term || lower.includes(` ${term} `))
  );
}

function lacksActionableLanguage(value = "") {
  return !value.match(/(create|generate|analyze|summarize|compare|design|build|plan|validate|refine)/i);
}

function inspectNormalizedContract(contract) {
  const warnings = [];
  const suggestions = [];

  if (isWeakText(contract.intent.objective)) {
    warnings.push("Objective may be too vague.");
  }

  if (lacksActionableLanguage(contract.intent.objective)) {
    warnings.push("Objective may lack a clear action verb.");
  }

  if (contract.intent.success_criteria.length < 2) {
    warnings.push("Success criteria may be too thin.");
  }

  if (contract.context.inputs.length === 1) {
    suggestions.push("Consider adding supporting context, examples, or prior decisions.");
  }

  const readinessScore = Math.max(0, 100 - warnings.length * 12 - suggestions.length * 3);

  return {
    readinessScore,
    warnings,
    suggestions
  };
}

function buildPrompt(contract) {
  return `You are an AI agent operating under the AI Experience Framework (AIX).

Your task is to help the human achieve the stated objective while preserving intent, respecting constraints, and making uncertainty visible.

## Intent

Objective:
${contract.intent.objective}

Success criteria:
${formatList(contract.intent.success_criteria)}

## Context

Project:
${contract.context.project}

Inputs available:
${formatList(contract.context.inputs)}

Prior decisions:
${formatList(contract.context.prior_decisions)}

## Constraints

Rules:
${formatList(contract.constraints.rules)}

Tools allowed:
${formatList(contract.constraints.tools_allowed)}

Disallowed:
${formatList(contract.constraints.disallowed)}

## Execution

Mode:
${contract.execution.mode}

Output format:
${contract.execution.output_format}

Verbosity:
${contract.execution.verbosity}

## Validation

Checks:
${formatList(contract.validation.checks)}

Definition of done:
${formatList(contract.validation.definition_of_done)}

## Operating instructions

1. Restate the objective only if clarification is needed.
2. Identify missing critical context before execution.
3. Ask at most one clarification question when required.
4. If enough context exists, proceed with the task.
5. Make assumptions explicit.
6. Validate the output against the success criteria and definition of done.
7. Clearly state any remaining uncertainty.
`;
}

export async function runAIX(contractPath) {
  const raw = fs.readFileSync(contractPath, "utf8");
  const contract = YAML.parse(raw);

  console.log("\nAIX Execution Preparation");
  console.log("-------------------------");
  console.log("This command prepares an AI-ready execution package. It does not call an AI model.");

  const validation = validateContract(contract);

  if (!validation.valid) {
    console.error("\nContract failed validation:");
    validation.humanErrors.forEach((error) => {
      console.error(`- ${error}`);
    });
    process.exit(1);
  }

  const normalized = normalizeContract(contract);
  const inspection = inspectNormalizedContract(normalized);

  console.log("\nPipeline");
  console.log("- Schema validation passed.");
  console.log("- Contract normalized.");
  console.log("- Inspection summary generated.");
  console.log("- Prompt prepared.");

  console.log("\nInspection Summary");
  console.log(`Contract readiness: ${inspection.readinessScore}/100`);

  if (inspection.warnings.length) {
    console.log("Warnings:");
    inspection.warnings.forEach((warning) => {
      console.log(`- ${warning}`);
    });
  } else {
    console.log("Warnings: none");
  }

  if (inspection.suggestions.length) {
    console.log("Suggestions:");
    inspection.suggestions.forEach((suggestion) => {
      console.log(`- ${suggestion}`);
    });
  } else {
    console.log("Suggestions: none");
  }

  console.log("\nExecution Package");
  console.log(`Mode: ${normalized.execution.mode}`);
  console.log(`Output format: ${normalized.execution.output_format}`);
  console.log(`Verbosity: ${normalized.execution.verbosity}`);

  console.log("\nPrepared Prompt");
  console.log(buildPrompt(normalized));
}
