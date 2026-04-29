#!/usr/bin/env node

import { Command } from "commander";
import { runAIX } from "./run.js";
import { generatePrompt } from "./prompt.js";
import { inspectContract } from "./inspect.js";
import { initContract } from "./init.js";

const program = new Command();

program
  .name("aix")
  .description("AI Experience Framework CLI")
  .version("0.1.0");

program
  .command("run")
  .argument("<contract>", "Path to an AIX contract YAML file")
  .description("Run an AIX contract through the framework pipeline")
  .action(async (contractPath) => {
    await runAIX(contractPath);
  });

program
  .command("prompt")
  .argument("<contract>", "Path to an AIX contract YAML file")
  .option("-o, --out <file>", "Write the generated prompt to a file")
  .option("--force", "Overwrite the output file if it already exists")
  .description("Generate an AI-ready prompt from an AIX contract")
  .action(async (contractPath, options) => {
    await generatePrompt(contractPath, options);
  });

program
  .command("inspect")
  .argument("<contract>", "Path to an AIX contract YAML file")
  .option("--json", "Output machine-readable JSON")
  .description("Inspect an AIX contract for clarity, completeness, and execution risk")
  .action(async (contractPath, options) => {
    await inspectContract(contractPath, options);
  });

program
  .command("init")
  .argument("<filename>", "Name of the contract file to create")
  .description("Create a new AIX contract template with guided comments")
  .action(async (filename) => {
    await initContract(filename);
  });

program.parse();
