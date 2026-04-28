

import fs from "fs";
import YAML from "yaml";
import { validateContract } from "./validate.js";
import { normalizeContract } from "./normalize.js";

function printPass(message) {
  console.log(`✓ ${message}`);
}

function printWarn(message) {
  console.log(`⚠ ${message}`);
}

function isWeakText(value = "") {
  const weakTerms = ["improve", "better", "optimize", "help", "stuff", "things", "good"];
  const lower = value.toLowerCase();

  return (
    value.trim().length < 20 ||
    weakTerms.some((term) => lower === term || lower.includes(` ${term} `))
  );
}

export async function inspectContract(contractPath) {
  const raw = fs.readFileSync(contractPath, "utf8");
  const contract = YAML.parse(raw);

  const validation = validateContract(contract);

  console.log("\nAIX Contract Inspection");
  console.log("-----------------------");

  if (!validation.valid) {
    printWarn("Contract does not match the AIX schema.");
    console.log(validation.errors);
    process.exit(1);
  }

  const normalized = normalizeContract(contract);
  let warnings = 0;

  console.log("\nIntent");
  if (isWeakText(normalized.intent.objective)) {
    printWarn("Objective may be too vague. Define the desired outcome more concretely.");
    warnings += 1;
  } else {
    printPass("Objective is defined.");
  }

  if (normalized.intent.success_criteria.length < 2) {
    printWarn("Success criteria may be too thin. Add at least two measurable or reviewable criteria.");
    warnings += 1;
  } else {
    printPass("Success criteria are present.");
  }

  console.log("\nContext");
  if (!normalized.context.project || normalized.context.project === "Untitled Project") {
    printWarn("Project name is missing or generic.");
    warnings += 1;
  } else {
    printPass("Project context is named.");
  }

  if (!normalized.context.inputs.length) {
    printWarn("No inputs are listed. Add source material, files, links, notes, data, or examples.");
    warnings += 1;
  } else {
    printPass("Inputs are listed.");
  }

  console.log("\nConstraints");
  if (!normalized.constraints.rules.length) {
    printWarn("No rules are defined. Add boundaries the AI must follow.");
    warnings += 1;
  } else {
    printPass("Rules are defined.");
  }

  if (!normalized.constraints.disallowed.length) {
    printWarn("No disallowed behaviors are defined. Consider adding failure modes to avoid.");
    warnings += 1;
  } else {
    printPass("Disallowed behaviors are defined.");
  }

  console.log("\nExecution");
  if (!normalized.execution.mode) {
    printWarn("Execution mode is missing.");
    warnings += 1;
  } else {
    printPass(`Execution mode is set to '${normalized.execution.mode}'.`);
  }

  if (!normalized.execution.output_format) {
    printWarn("Output format is missing.");
    warnings += 1;
  } else {
    printPass(`Output format is set to '${normalized.execution.output_format}'.`);
  }

  console.log("\nValidation");
  if (!normalized.validation.checks.length) {
    printWarn("No validation checks are listed.");
    warnings += 1;
  } else {
    printPass("Validation checks are listed.");
  }

  if (!normalized.validation.definition_of_done.length) {
    printWarn("Definition of done is missing.");
    warnings += 1;
  } else {
    printPass("Definition of done is listed.");
  }

  console.log("\nSummary");
  if (warnings === 0) {
    printPass("Contract is strong enough for AI-assisted execution.");
  } else {
    printWarn(`${warnings} improvement area(s) found. Refine the contract before execution for better AIX quality.`);
  }
}