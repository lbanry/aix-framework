#!/usr/bin/env node

import { Command } from "commander";
import { runAIX } from "./run.js";
import { generatePrompt } from "./prompt.js";

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
  .description("Generate an AI-ready prompt from an AIX contract")
  .action(async (contractPath) => {
    await generatePrompt(contractPath);
  });

program.parse();