#!/usr/bin/env node

import { Command } from "commander";
import { runAIX } from "./run.js";
import { generatePrompt } from "./prompt.js";
import { inspectContract } from "./inspect.js";
import { initContract } from "./init.js";
import {
  inspectInterfaceSystem,
  inspectInterfacePlan,
  planInterface,
  promptInterface
} from "./interface/commands.js";

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

const interfaceCommand = program
  .command("interface")
  .description("Plan design-system-aware interfaces from structured UX artifacts");

interfaceCommand
  .command("inspect-system")
  .argument("<system>", "Path to an AIX interface system YAML file")
  .description("Inspect whether an interface system is ready for orchestration")
  .action(async (systemPath) => {
    await inspectInterfaceSystem(systemPath);
  });

interfaceCommand
  .command("plan")
  .argument("<requirement>", "Path to an interface requirement YAML file")
  .requiredOption("--system <system>", "Path to an interface system YAML file")
  .requiredOption("--research <research>", "Path to UX research findings YAML file")
  .option("-o, --out <file>", "Write the generated interface plan to a file")
  .option("--force", "Overwrite the output file if it already exists")
  .description("Create a structured interface plan without rendering or freeform UI generation")
  .action(async (requirementPath, options) => {
    await planInterface(requirementPath, options);
  });

interfaceCommand
  .command("inspect-plan")
  .argument("<plan>", "Path to an AIX interface plan YAML file")
  .description("Inspect UX fit, traceability, and design-system compliance")
  .action(async (planPath) => {
    await inspectInterfacePlan(planPath);
  });

interfaceCommand
  .command("prompt")
  .argument("<plan>", "Path to an AIX interface plan YAML file")
  .description("Generate an implementation prompt from an approved interface plan")
  .action(async (planPath) => {
    await promptInterface(planPath);
  });

program.parse();
