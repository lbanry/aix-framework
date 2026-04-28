export function normalizeContract(contract) {
  return {
    ...contract,
    context: {
      project: "Untitled Project",
      inputs: [],
      prior_decisions: [],
      ...contract.context
    },
    constraints: {
      rules: [],
      tools_allowed: [],
      disallowed: [],
      ...contract.constraints
    },
    execution: {
      verbosity: "medium",
      ...contract.execution
    },
    validation: {
      checks: [],
      definition_of_done: [],
      ...contract.validation
    }
  };
}