function slugify(value) {
  return value
    .replaceAll("_", "-")
    .replace(/[^a-z0-9-]+/gi, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();
}

function titleize(value) {
  return value
    .split(/[_-]/)
    .filter(Boolean)
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(" ");
}

function findPattern(system, requirement) {
  const taskType = requirement.screen.task_type;

  return system.patterns.find((pattern) => pattern.use_when.includes(taskType))
    || system.patterns[0];
}

function findComponent(system, informationItem) {
  return system.components.find((component) => component.supports.includes(informationItem));
}

function findResearchSources(research, taskType) {
  return research.findings
    .filter((finding) => finding.supports_task_types.includes(taskType))
    .map((finding) => finding.id);
}

function findSectionResearchSources(research, taskType, informationItem) {
  return research.findings
    .filter((finding) => {
      if (!finding.supports_task_types.includes(taskType)) return false;
      if (!finding.supports_information) return true;
      return finding.supports_information.includes(informationItem);
    })
    .map((finding) => finding.id);
}

export function buildInterfacePlan(system, research, requirement) {
  const pattern = findPattern(system, requirement);
  const researchSources = findResearchSources(research, requirement.screen.task_type);
  const gaps = [];

  const missingPatternComponents = pattern.required_components.filter((componentId) => {
    return !system.components.some((component) => component.id === componentId);
  });

  missingPatternComponents.forEach((componentId) => {
    gaps.push(`Pattern '${pattern.id}' requires missing component '${componentId}'.`);
  });

  const sections = requirement.screen.required_information
    .map((informationItem) => {
      const component = findComponent(system, informationItem);

      if (!component) {
        gaps.push(`No approved component supports required information '${informationItem}'.`);
        return null;
      }

      return {
        id: slugify(informationItem),
        title: titleize(informationItem),
        pattern: pattern.id,
        components: [component.id],
        requirements: [informationItem],
        findings: findSectionResearchSources(research, requirement.screen.task_type, informationItem),
        rationale: `Use ${component.id} to satisfy '${informationItem}' within the ${pattern.id} pattern.`
      };
    })
    .filter(Boolean);

  const orderedSections = pattern.information_order
    .map((item) => sections.find((section) => section.requirements.includes(item)))
    .filter(Boolean);

  const unorderedSections = sections.filter((section) => {
    return !orderedSections.some((ordered) => ordered.id === section.id);
  });

  return {
    screen_id: requirement.screen.id,
    user_goal: requirement.screen.user_goal,
    task_type: requirement.screen.task_type,
    risk_level: requirement.screen.risk_level,
    system: system.name,
    research_sources: researchSources,
    sections: [...orderedSections, ...unorderedSections],
    gaps,
    validation_checks: [
      "Every required information item is mapped to an approved component.",
      "Each section references an approved pattern.",
      "Research-backed sections include finding IDs.",
      "Gaps are listed instead of inventing components."
    ],
    generation_boundary: "Generate implementation guidance only from this plan; do not invent new layout, components, or interaction patterns."
  };
}

export function inspectInterfacePlan(plan) {
  const warnings = [];

  if (plan.gaps.length > 0) {
    warnings.push("Plan contains unresolved design-system gaps.");
  }

  if (plan.research_sources.length === 0) {
    warnings.push("Plan has no linked UX research findings.");
  }

  plan.sections.forEach((section) => {
    if (!section.findings.length) {
      warnings.push(`Section '${section.id}' has no linked UX research findings.`);
    }
  });

  return {
    valid: warnings.length === 0,
    warnings
  };
}
