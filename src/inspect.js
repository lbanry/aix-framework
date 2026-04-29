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

function printInsight(message) {
  console.log(`→ ${message}`);
}

function calculateReadinessScore(warnings, suggestions) {
  return Math.max(0, 100 - warnings * 12 - suggestions * 3);
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
  let suggestions = 0;

  console.log("\nIntent");
  if (isWeakText(normalized.intent.objective)) {
    printWarn("Objective may be too vague.");
    printInsight("Clarify what the AI should produce, not just what should be improved.");
    warnings += 1;
  } else {
    printPass("Objective is defined.");
  }

  if (lacksActionableLanguage(normalized.intent.objective)) {
    printWarn("Objective may lack a clear action verb.");
    printInsight("Use verbs like analyze, generate, summarize, compare, design, build, plan, validate, or refine.");
    warnings += 1;
  }

  if (normalized.intent.success_criteria.length < 2) {
    printWarn("Success criteria may be too thin.");
    printInsight("Add at least two criteria that can be reviewed by a human.");
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
    printWarn("No inputs are listed.");
    printInsight("Add source material such as files, links, notes, code, data, examples, or decisions.");
    warnings += 1;
  } else {
    printPass("Inputs are listed.");
  }

  if (normalized.context.inputs.length === 1) {
    printInsight("Single input detected. Consider adding supporting context, examples, or prior decisions.");
    suggestions += 1;
  }

  console.log("\nConstraints");
  if (!normalized.constraints.rules.length) {
    printWarn("No rules are defined.");
    printInsight("Rules reduce drift and help preserve human intent.");
    warnings += 1;
  } else {
    printPass("Rules are defined.");
  }

  if (!normalized.constraints.disallowed.length) {
    printWarn("No disallowed behaviors are defined.");
    printInsight("Add failure modes to prevent predictable bad outputs.");
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
    printInsight("Add checks that confirm correctness, not just completion.");
    warnings += 1;
  } else {
    printPass("Validation checks are listed.");
  }

  if (!normalized.validation.definition_of_done.length) {
    printWarn("Definition of done is missing.");
    printInsight("Define when the system should stop iterating.");
    warnings += 1;
  } else {
    printPass("Definition of done is listed.");
  }

  console.log("\nSummary");
  const readinessScore = calculateReadinessScore(warnings, suggestions);
  console.log(`Contract readiness: ${readinessScore}/100`);

  if (warnings === 0) {
    printPass("Strong contract. Ready for execution.");
  } else {
    printWarn(`${warnings} warning(s) found.`);
    printInsight("Refine contract → re-run inspect → then generate prompt.");
  }

  if (suggestions > 0) {
    printInsight(`${suggestions} suggestion(s) available.`);
  }

  console.log("\nSuggested Improvements");
  let printedSuggestions = 0;

  if (isWeakText(normalized.intent.objective)) {
    console.log("- Rewrite the objective so it names the action, input, output, and intended use.");
    console.log('  Example: "Analyze [input] to produce [specific output] for [use case]."');
    printedSuggestions += 1;
  }

  if (lacksActionableLanguage(normalized.intent.objective)) {
    console.log("- Suggested YAML fix:");
    console.log("  intent:");
    console.log('    objective: "Analyze [input] to produce [specific output] for [use case]."');
    printedSuggestions += 1;
  }

  if (normalized.intent.success_criteria.length < 2) {
    console.log("- Add at least two success criteria that can be reviewed by a human.");
    console.log('  Example: "The output preserves the key points from the input."');
    console.log('  Example: "The result is specific enough to act on without additional interpretation."');
    printedSuggestions += 1;
  }

  if (!normalized.context.inputs.length) {
    console.log("- Add at least one concrete input, such as a document, link, dataset, transcript, brief, code file, or note.");
    printedSuggestions += 1;
  }

  if (normalized.context.inputs.length === 1) {
    console.log("- Consider adding supporting context, such as prior decisions, examples, constraints, or target audience.");
    printedSuggestions += 1;
  }

  if (!normalized.constraints.rules.length) {
    console.log("- Add rules that shape how the AI should work.");
    console.log('  Example: "Do not invent information not supported by the provided inputs."');
    console.log('  Example: "State assumptions clearly before making recommendations."');
    printedSuggestions += 1;
  }

  if (!normalized.constraints.disallowed.length) {
    console.log("- Add disallowed behaviors to prevent predictable failure modes.");
    console.log('  Example: "Do not ignore stated constraints."');
    console.log('  Example: "Do not present speculation as fact."');
    printedSuggestions += 1;
  }

  if (!normalized.validation.checks.length) {
    console.log("- Add validation checks that confirm correctness, not just completion.");
    console.log('  Example: "Confirm the output directly addresses the objective."');
    console.log('  Example: "Confirm the output respects every listed constraint."');
    printedSuggestions += 1;
  }

  if (!normalized.validation.definition_of_done.length) {
    console.log("- Add a definition of done so the system knows when to stop iterating.");
    console.log('  Example: "The human can act on the result without asking for a full rewrite."');
    printedSuggestions += 1;
  }

  if (printedSuggestions === 0) {
    console.log("- None.");
  }
}
