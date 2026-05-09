import fs from "fs";
import path from "path";

const template = `# AIX Contract Template
# This file is intentionally valid as-is.
# Replace the placeholder guidance with project-specific details.

intent:
  # Describe the exact outcome you want to achieve.
  objective: "Describe the exact outcome you want to achieve."

  # Define what success looks like. Prefer specific, reviewable criteria.
  success_criteria:
    - "Define the first condition that must be true for success."
    - "Define the second condition that must be true for success."

context:
  # Name or describe the project, task, or decision area.
  project: "Name or describe the project or task."

  # List source material the AI should consider: documents, data, links, notes, examples, etc.
  inputs:
    - "List the primary input or source material."

  # List decisions, assumptions, or prior context that must be respected.
  prior_decisions:
    - "List any decision or constraint that should carry forward."

constraints:
  # Rules the AI must follow while completing the task.
  rules:
    - "Preserve the human's stated intent."
    - "Make assumptions explicit."

  # Optional: list tools or capabilities the AI may use.
  tools_allowed:
    - "Chat interface"

  # Define what the AI must not do.
  disallowed:
    - "Do not invent unsupported facts."
    - "Do not ignore stated constraints."

execution:
  # Mode: plan | analyze | generate | execute | validate | refine
  mode: analyze

  # Output format: structured, summary, checklist, table, code, etc.
  output_format: structured

  # verbosity: low | medium | high
  verbosity: medium

validation:
  # How the human or system will evaluate correctness.
  checks:
    - "Confirm the output matches the stated objective."
    - "Confirm the output respects all constraints."

  # Define when the result is complete enough to stop iterating.
  definition_of_done:
    - "The human can understand and act on the result."
    - "Any remaining uncertainty is clearly stated."
`;

function assertValidFilename(filename) {
  if (!filename || !filename.trim()) {
    throw new Error("A filename is required.");
  }

  const extension = path.extname(filename).toLowerCase();
  if (extension !== ".yaml" && extension !== ".yml") {
    throw new Error("AIX contract files must use a .yaml or .yml extension.");
  }
}

export async function initContract(filename, options = {}) {
  try {
    assertValidFilename(filename);

    const { force = false, dryRun = false } = options;
    const targetPath = path.resolve(filename);
    const targetDirectory = path.dirname(targetPath);

    if (!fs.existsSync(targetDirectory)) {
      throw new Error(`Directory does not exist: ${targetDirectory}`);
    }

    if (fs.existsSync(targetPath) && !force) {
      throw Object.assign(new Error("File exists"), { code: "EEXIST" });
    }

    if (dryRun) {
      console.log("[DRY RUN] Would create file:", targetPath);
      return;
    }

    fs.writeFileSync(targetPath, template, { flag: force ? "w" : "wx" });

    console.log(`✓ Created AIX contract: ${targetPath}`);
    console.log(`→ Inspect: node ./src/cli.js inspect ${filename}`);
    console.log(`→ Prompt:  node ./src/cli.js prompt ${filename}`);
  } catch (error) {
    if (error.code === "EEXIST") {
      console.error(`File already exists. Aborting to prevent overwrite: ${filename}`);
      process.exit(1);
    }

    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
}