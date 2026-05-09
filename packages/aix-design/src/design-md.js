const defaultInformationOrder = [
  "headline",
  "product_offer",
  "primary_cta",
  "art_styles",
  "included_package",
  "how_it_works",
  "optional_upgrades",
  "faq",
  "intake_form",
  "style_selection",
  "photo_uploads",
  "photo_permission",
  "upgrade_interest",
  "order_summary",
  "confirmation",
  "admin_order_record",
  "success_metrics"
];

const defaultComponents = [
  {
    id: "PageHeader",
    purpose: "Introduce the interface goal, offer, and primary action.",
    supports: ["headline", "product_offer", "primary_cta"],
    states: ["default", "focus"]
  },
  {
    id: "Button",
    purpose: "Trigger explicit user actions.",
    supports: ["primary_cta", "secondary_cta", "choose_style", "place_test_order"],
    states: ["primary", "secondary", "disabled", "focus"]
  },
  {
    id: "Card",
    purpose: "Group related content into a reusable surface.",
    supports: ["product_offer", "art_styles", "included_package", "how_it_works", "optional_upgrades", "confirmation"],
    states: ["default", "selected", "focus"]
  },
  {
    id: "ChoiceList",
    purpose: "Represent bounded single-select or multi-select choices.",
    supports: ["art_styles", "style_selection", "upgrade_interest"],
    states: ["selected", "unselected", "focus"]
  },
  {
    id: "FormLayout",
    purpose: "Collect structured user and fulfillment details.",
    supports: ["intake_form", "customer_details", "graduate_details", "delivery_deadline"],
    states: ["default", "error", "focus"]
  },
  {
    id: "FileInput",
    purpose: "Collect files or images needed to complete a task.",
    supports: ["photo_uploads", "asset_uploads"],
    states: ["default", "selected", "error", "focus"]
  },
  {
    id: "Checkbox",
    purpose: "Capture consent and optional interest.",
    supports: ["photo_permission", "upgrade_interest"],
    states: ["checked", "unchecked", "focus"]
  },
  {
    id: "DescriptionList",
    purpose: "Summarize structured details in labeled rows.",
    supports: ["order_summary", "success_metrics", "admin_order_record"],
    states: ["default"]
  },
  {
    id: "Accordion",
    purpose: "Expose supporting questions without overwhelming the primary flow.",
    supports: ["faq"],
    states: ["expanded", "collapsed", "focus"]
  },
  {
    id: "Banner",
    purpose: "Communicate important status, constraints, and next steps.",
    supports: ["confirmation", "product_offer"],
    states: ["info", "success", "warning", "error"]
  }
];

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function toTitle(value) {
  return value
    .replace(/\.[a-z0-9]+$/i, "")
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function extractSection(markdown, headingPattern) {
  const heading = markdown.match(headingPattern);
  if (!heading || heading.index === undefined) return "";

  const contentStart = heading.index + heading[0].length;
  const nextHeading = markdown.slice(contentStart).search(/\s##\s+\d*\.?\s*[A-Z]/);
  const contentEnd = nextHeading === -1
    ? markdown.length
    : contentStart + nextHeading;

  return markdown.slice(contentStart, contentEnd).trim();
}

function extractListItems(text) {
  return text
    .split(/\n| - |\* /)
    .map((item) => item.replace(/^[-*]\s*/, "").trim())
    .filter((item) => item.length >= 12)
    .map((item) => item.replace(/\s+/g, " "))
    .slice(0, 8);
}

function extractHexColors(markdown) {
  return [...new Set(markdown.match(/#[0-9a-f]{6}\b/gi) || [])].slice(0, 16);
}

function extractSpacingTokens(markdown) {
  const matches = markdown.match(/\b(?:space|spacing|layout|radius)-[a-z0-9-]+|\b\d+px\b/gi) || [];
  return [...new Set(matches.map((match) => match.toLowerCase()))].slice(0, 16);
}

function pickRules(...sections) {
  const rules = sections.flatMap((section) => extractListItems(section));
  return rules.length
    ? rules.slice(0, 6)
    : ["Use the imported design system guidance before making visual decisions."];
}

function componentRules(component, sections) {
  const baseRules = pickRules(sections.components, sections.layout, sections.dosDonts);

  if (component.id === "PageHeader") {
    return [
      "Use the imported typography, color, and layout guidance for the first viewport.",
      ...baseRules
    ].slice(0, 6);
  }

  if (component.id === "Button") {
    return [
      "Button labels must state the action that will occur.",
      ...baseRules
    ].slice(0, 6);
  }

  if (component.id === "FormLayout") {
    return [
      "Group related fields and preserve accessible labels, focus, and error states.",
      ...baseRules
    ].slice(0, 6);
  }

  return baseRules;
}

export function importDesignMarkdown(markdown, options = {}) {
  const sourceName = options.sourceName || "Imported";
  const systemName = options.name || `${toTitle(sourceName)} Interface System`;
  const patternId = options.patternId || `${slugify(systemName)}-flow`;
  const taskType = options.taskType || "consumer_mvp_landing";

  const sections = {
    color: extractSection(markdown, /##\s+\d*\.?\s*Color Palette & Roles/i),
    typography: extractSection(markdown, /##\s+\d*\.?\s*Typography Rules/i),
    components: extractSection(markdown, /##\s+\d*\.?\s*Component Stylings/i),
    layout: extractSection(markdown, /##\s+\d*\.?\s*Layout Principles/i),
    depth: extractSection(markdown, /##\s+\d*\.?\s*Depth & Elevation/i),
    dosDonts: extractSection(markdown, /##\s+\d*\.?\s*Do'?s and Don'?ts/i),
    responsive: extractSection(markdown, /##\s+\d*\.?\s*Responsive Behavior/i),
    promptGuide: extractSection(markdown, /##\s+\d*\.?\s*Agent Prompt Guide/i)
  };

  const colorTokens = extractHexColors(sections.color || markdown);
  const spacingTokens = extractSpacingTokens(sections.layout || markdown);
  const patternRules = pickRules(sections.layout, sections.responsive, sections.promptGuide, sections.dosDonts);

  return {
    name: systemName,
    version: "0.1.0",
    tokens: {
      color: colorTokens.length ? colorTokens : ["background", "surface", "text", "muted", "border", "accent"],
      spacing: spacingTokens.length ? spacingTokens : ["space-100", "space-200", "space-400", "space-800"]
    },
    components: defaultComponents.map((component) => ({
      ...component,
      rules: componentRules(component, sections)
    })),
    patterns: [
      {
        id: patternId,
        purpose: `Orchestrate interfaces using ${systemName} guidance imported from DESIGN.md.`,
        use_when: [taskType],
        required_components: defaultComponents.map((component) => component.id),
        information_order: defaultInformationOrder,
        rules: [
          "Use the imported DESIGN.md as the active visual and interaction reference.",
          "Choose approved components and patterns before generating interface details.",
          ...patternRules
        ].slice(0, 8)
      }
    ],
    accessibility_rules: [
      "Preserve visible focus states for keyboard users.",
      "Use semantic headings and native form controls where possible.",
      "Do not rely on color alone for state, status, or comparison.",
      "Provide text alternatives for product and style imagery.",
      "Validate responsive behavior against the imported breakpoint guidance."
    ]
  };
}
