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

function addGap(gaps, severity, issue, impact) {
  gaps.push({ severity, issue, impact });
}

function calculateScore(base, penalties) {
  return Math.max(0, base - penalties.reduce((total, value) => total + value, 0));
}

function scoreGaps(gaps) {
  return gaps.map((gap) => {
    if (gap.severity === "blocking") return 35;
    if (gap.severity === "major") return 18;
    return 6;
  });
}

export function buildInterfacePlan(system, research, requirement) {
  const pattern = findPattern(system, requirement);
  const researchSources = findResearchSources(research, requirement.screen.task_type);
  const gaps = [];

  const missingPatternComponents = pattern.required_components.filter((componentId) => {
    return !system.components.some((component) => component.id === componentId);
  });

  missingPatternComponents.forEach((componentId) => {
    addGap(
      gaps,
      "blocking",
      `Pattern '${pattern.id}' requires missing component '${componentId}'.`,
      "The selected pattern cannot be executed as specified by the design system."
    );
  });

  const sections = requirement.screen.required_information
    .map((informationItem) => {
      const component = findComponent(system, informationItem);

      if (!component) {
        addGap(
          gaps,
          "blocking",
          `No approved component supports required information '${informationItem}'.`,
          "AIX must not invent a component to satisfy required information."
        );
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
      "Status is communicated with text and not color alone.",
      "Gaps are listed instead of inventing components."
    ],
    generation_boundary: "Generate implementation guidance only from this plan; do not invent new layout, components, or interaction patterns."
  };
}

export function inspectInterfacePlan(plan) {
  const warnings = [];
  const blockingGaps = plan.gaps.filter((gap) => gap.severity === "blocking");
  const majorGaps = plan.gaps.filter((gap) => gap.severity === "major");
  const sectionsWithoutResearch = plan.sections.filter((section) => !section.findings.length);
  const validationMentionsAccessibility = plan.validation_checks.some((check) => {
    return /accessib|color|contrast|keyboard|screen reader|status text/i.test(check);
  });
  const generationBoundaryIsExplicit = /do not invent|approved|boundary|plan/i.test(plan.generation_boundary);
  const hasReadinessFirst = plan.sections[0]?.requirements.includes("readiness_score");
  const actionSectionIndex = plan.sections.findIndex((section) => section.requirements.includes("next_actions"));
  const actionsComeLast = actionSectionIndex === -1 || actionSectionIndex === plan.sections.length - 1;

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

  if (!validationMentionsAccessibility) {
    warnings.push("Plan does not include an explicit accessibility validation check.");
  }

  if (!generationBoundaryIsExplicit) {
    warnings.push("Generation boundary is not explicit enough.");
  }

  if (!hasReadinessFirst && plan.sections.some((section) => section.requirements.includes("readiness_score"))) {
    warnings.push("Readiness score is present but not first in the information hierarchy.");
  }

  if (!actionsComeLast) {
    warnings.push("Next actions should appear after readiness and issue review.");
  }

  const scorecard = {
    uxFit: calculateScore(100, [
      ...scoreGaps(plan.gaps),
      hasReadinessFirst ? 0 : 12,
      actionsComeLast ? 0 : 12
    ]),
    designSystemFit: calculateScore(100, scoreGaps(plan.gaps)),
    researchCoverage: calculateScore(100, [
      plan.research_sources.length ? 0 : 30,
      sectionsWithoutResearch.length * 15
    ]),
    accessibilityCoverage: validationMentionsAccessibility ? 100 : 70,
    generationReadiness: calculateScore(100, [
      ...scoreGaps(blockingGaps),
      majorGaps.length * 12,
      generationBoundaryIsExplicit ? 0 : 20
    ])
  };

  const overallScore = Math.round(
    (
      scorecard.uxFit
      + scorecard.designSystemFit
      + scorecard.researchCoverage
      + scorecard.accessibilityCoverage
      + scorecard.generationReadiness
    ) / 5
  );

  return {
    valid: blockingGaps.length === 0 && warnings.length === 0,
    warnings,
    scorecard,
    overallScore
  };
}
