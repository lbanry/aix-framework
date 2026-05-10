import fs from "fs";
import YAML from "yaml";
import { validateInterfaceArtifact } from "./validation.js";
import { buildInterfacePlan, inspectInterfacePlan as inspectPlanReadiness } from "./planner.js";
import { importDesignMarkdown } from "./design-md.js";
import {
  scaffoldPrototypeFiles,
  servePrototypeDirectory,
  verifyPrototypeDirectory
} from "./prototype.js";

function readYaml(filePath) {
  return YAML.parse(fs.readFileSync(filePath, "utf8"));
}

function printErrors(title, errors) {
  console.error(`\n${title}`);
  errors.forEach((error) => {
    console.error(`- ${error}`);
  });
}

function assertValid(type, value) {
  const validation = validateInterfaceArtifact(type, value);

  if (!validation.valid) {
    printErrors(`${type} failed validation:`, validation.humanErrors);
    process.exit(1);
  }
}

function writeYamlOrPrint(value, options = {}) {
  const output = YAML.stringify(value);
  const outputLabel = options.outputLabel || "interface plan";

  if (options.out) {
    if (fs.existsSync(options.out) && !options.force) {
      console.error(`Output file already exists. Use --force to overwrite: ${options.out}`);
      process.exit(1);
    }

    fs.writeFileSync(options.out, output, { flag: options.force ? "w" : "wx" });
    console.log(`Wrote ${outputLabel}: ${options.out}`);
    return;
  }

  console.log(output.trimEnd());
}

export async function inspectInterfaceSystem(systemPath) {
  const system = readYaml(systemPath);
  assertValid("system", system);

  const componentIds = new Set(system.components.map((component) => component.id));
  const gaps = [];

  system.patterns.forEach((pattern) => {
    pattern.required_components.forEach((componentId) => {
      if (!componentIds.has(componentId)) {
        gaps.push(`Pattern '${pattern.id}' references missing component '${componentId}'.`);
      }
    });
  });

  console.log("\nAIX Interface System Inspection");
  console.log("-------------------------------");
  console.log(`System: ${system.name} (${system.version})`);
  console.log(`Components: ${system.components.length}`);
  console.log(`Patterns: ${system.patterns.length}`);
  console.log(`Accessibility rules: ${system.accessibility_rules.length}`);

  if (gaps.length) {
    console.log("\nGaps");
    gaps.forEach((gap) => console.log(`- ${gap}`));
    process.exit(1);
  }

  console.log("\nResult");
  console.log("✓ Interface system is ready for orchestration.");
}

export async function importInterfaceDesignSystem(designPath, options = {}) {
  const markdown = fs.readFileSync(designPath, "utf8");
  const system = importDesignMarkdown(markdown, {
    name: options.name,
    patternId: options.patternId,
    taskType: options.taskType,
    sourceName: designPath
  });

  assertValid("system", system);
  writeYamlOrPrint(system, { ...options, outputLabel: "interface system" });
}

export async function planInterface(requirementPath, options = {}) {
  if (!options.system || !options.research) {
    console.error("Both --system and --research are required.");
    process.exit(1);
  }

  const system = readYaml(options.system);
  const research = readYaml(options.research);
  const requirement = readYaml(requirementPath);

  assertValid("system", system);
  assertValid("research", research);
  assertValid("requirement", requirement);

  const plan = buildInterfacePlan(system, research, requirement);
  assertValid("plan", plan);
  writeYamlOrPrint(plan, options);
}

export async function inspectInterfacePlan(planPath) {
  const plan = readYaml(planPath);
  assertValid("plan", plan);

  const inspection = inspectPlanReadiness(plan);

  console.log("\nAIX Interface Plan Inspection");
  console.log("-----------------------------");
  console.log(`Screen: ${plan.screen_id}`);
  console.log(`Task type: ${plan.task_type}`);
  console.log(`Sections: ${plan.sections.length}`);
  console.log(`Research sources: ${plan.research_sources.length}`);
  console.log(`Overall score: ${inspection.overallScore}/100`);

  console.log("\nScorecard");
  console.log(`- UX fit: ${inspection.scorecard.uxFit}/100`);
  console.log(`- Design-system fit: ${inspection.scorecard.designSystemFit}/100`);
  console.log(`- Research coverage: ${inspection.scorecard.researchCoverage}/100`);
  console.log(`- Accessibility coverage: ${inspection.scorecard.accessibilityCoverage}/100`);
  console.log(`- Generation readiness: ${inspection.scorecard.generationReadiness}/100`);

  if (plan.gaps.length) {
    console.log("\nGaps");
    plan.gaps.forEach((gap) => {
      console.log(`- [${gap.severity}] ${gap.issue}`);
      console.log(`  Impact: ${gap.impact}`);
    });
  }

  if (inspection.warnings.length) {
    console.log("\nWarnings");
    inspection.warnings.forEach((warning) => console.log(`- ${warning}`));
    process.exit(1);
  }

  console.log("\nResult");
  console.log("✓ Interface plan is ready for prompt generation.");
}

function formatList(items = []) {
  if (!items.length) return "- None";
  return items.map((item) => {
    if (typeof item === "string") return `- ${item}`;
    return `- [${item.severity}] ${item.issue}\n  Impact: ${item.impact}`;
  }).join("\n");
}

export async function promptInterface(planPath) {
  const plan = readYaml(planPath);
  assertValid("plan", plan);

  const inspection = inspectPlanReadiness(plan);
  if (!inspection.valid) {
    printErrors("Interface plan is not ready for prompt generation:", inspection.warnings);
    process.exit(1);
  }

  const sections = plan.sections.map((section) => {
    return `### ${section.title}
Pattern: ${section.pattern}
Components: ${section.components.join(", ")}
Requirements: ${section.requirements.join(", ")}
Research findings: ${section.findings.join(", ")}
Rationale: ${section.rationale}`;
  }).join("\n\n");

  console.log(`You are creating an interface from an AIX interface plan.

Follow the plan exactly. Use approved patterns and components first. Do not invent layout, components, or interactions beyond the stated generation boundary.

## Screen

ID: ${plan.screen_id}
User goal: ${plan.user_goal}
Task type: ${plan.task_type}
Risk level: ${plan.risk_level}
Design system: ${plan.system}

## Research Sources

${formatList(plan.research_sources)}

## Sections

${sections}

## Gaps

${formatList(plan.gaps)}

## Validation Checks

${formatList(plan.validation_checks)}

## Generation Boundary

${plan.generation_boundary}
`);
}

export async function scaffoldPrototype(planPath, options = {}) {
  if (!options.system) {
    console.error("--system is required.");
    process.exit(1);
  }

  if (!options.out) {
    console.error("--out is required.");
    process.exit(1);
  }

  const plan = readYaml(planPath);
  const system = readYaml(options.system);

  assertValid("plan", plan);
  assertValid("system", system);

  const inspection = inspectPlanReadiness(plan);
  if (!inspection.valid) {
    printErrors("Interface plan is not ready for prototype generation:", inspection.warnings);
    process.exit(1);
  }

  try {
    const { manifest, report } = scaffoldPrototypeFiles(plan, system, {
      out: options.out,
      force: options.force,
      planPath,
      systemPath: options.system
    });

    assertValid("prototypeManifest", manifest);
    assertValid("prototypeValidationReport", report);

    console.log(`Wrote prototype: ${options.out}`);
    console.log(`Validation: ${report.summary.errors} error(s), ${report.summary.warnings} warning(s)`);

    if (!report.valid) {
      process.exit(1);
    }
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
}

export async function verifyPrototype(prototypeDir, options = {}) {
  if (!options.plan || !options.system) {
    console.error("Both --plan and --system are required.");
    process.exit(1);
  }

  const plan = readYaml(options.plan);
  const system = readYaml(options.system);

  assertValid("plan", plan);
  assertValid("system", system);

  const report = verifyPrototypeDirectory(prototypeDir, plan, system);
  assertValid("prototypeValidationReport", report);

  if (options.json) {
    console.log(JSON.stringify(report, null, 2));
  } else {
    console.log("\nAIX Prototype Verification");
    console.log("--------------------------");
    console.log(`Prototype: ${prototypeDir}`);
    console.log(`Errors: ${report.summary.errors}`);
    console.log(`Warnings: ${report.summary.warnings}`);

    if (report.findings.length) {
      console.log("\nFindings");
      report.findings.forEach((finding) => {
        console.log(`- [${finding.severity}] ${finding.rule_id}: ${finding.message}`);
      });
    }

    if (report.valid) {
      console.log("\nResult");
      console.log("✓ Prototype is valid.");
    }
  }

  if (!report.valid) {
    process.exit(1);
  }
}

export async function devPrototype(prototypeDir, options = {}) {
  servePrototypeDirectory(prototypeDir, options);
}
