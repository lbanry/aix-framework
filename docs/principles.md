# AIX Principles

AIX exists to make AI collaboration easier to inspect, repeat, and improve.

## 1. Make intent explicit

The human should state the desired outcome before the AI acts.

## 2. Preserve context

Contracts should name the source material, prior decisions, and assumptions the AI must respect.

## 3. Constrain execution

Useful AI work needs boundaries: rules, allowed tools, and disallowed behaviors.

## 4. Validate before finalizing

Every contract should define checks and a definition of done before output is treated as complete.

## 5. Keep the human responsible

AIX structures AI work, but the human remains responsible for judgment, approval, and final use.

## What AIX is

- A contract layer between humans and AI systems.
- A way to make intent, context, constraints, execution, and validation explicit.
- A local-first framework for preparing reliable AI work.
- A validation-first workflow for improving prompts before execution.

## What AIX is not

- A prompt library.
- A model provider.
- A UI framework.
- A replacement for human review.
- A guarantee that AI output is correct.

## Writing a Good Contract

A good AIX contract should:

- name the concrete outcome
- list the source material the AI should use
- state prior decisions and assumptions
- define constraints before execution
- identify failure modes to avoid
- describe how the human will validate the output

If a contract cannot describe success, it is not ready for execution.
