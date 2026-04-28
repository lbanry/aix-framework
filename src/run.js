import fs from "fs";
import YAML from "yaml";
import { validateContract } from "./validate.js";
import { normalizeContract } from "./normalize.js";

export async function runAIX(contractPath) {
  const raw = fs.readFileSync(contractPath, "utf8");
  const contract = YAML.parse(raw);

  console.log("\nAIX Framework Run");
  console.log("-----------------");

  const validation = validateContract(contract);

  if (!validation.valid) {
    console.error("\nContract failed validation:");
    console.error(validation.errors);
    process.exit(1);
  }

  const normalized = normalizeContract(contract);

  console.log("\nContract valid.");

  console.log("\nIntent");
  console.log(`Objective: ${normalized.intent.objective}`);

  console.log("\nSuccess Criteria");
  normalized.intent.success_criteria.forEach((item) => {
    console.log(`- ${item}`);
  });

  console.log("\nContext");
  console.log(`Project: ${normalized.context.project}`);

  console.log("\nExecution");
  console.log(`Mode: ${normalized.execution.mode}`);
  console.log(`Output Format: ${normalized.execution.output_format}`);
  console.log(`Verbosity: ${normalized.execution.verbosity}`);

  console.log("\nValidation Checks");
  normalized.validation.checks.forEach((check) => {
    console.log(`- ${check}`);
  });

  console.log("\nDefinition of Done");
  normalized.validation.definition_of_done.forEach((item) => {
    console.log(`- ${item}`);
  });

  console.log("\nAIX contract is ready for AI-assisted execution.");
}