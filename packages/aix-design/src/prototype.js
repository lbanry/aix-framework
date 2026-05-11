import fs from "fs";
import http from "http";
import path from "path";

const validationRules = [
  "prototype.plan.screen-mapped",
  "prototype.plan.section-mapped",
  "prototype.system.pattern-approved",
  "prototype.system.component-approved",
  "prototype.html.semantic-main",
  "prototype.html.heading-order",
  "prototype.html.button-name",
  "prototype.tokens.no-unknown-token",
  "prototype.render.metadata-present",
  "prototype.render.element-allowed",
  "prototype.render.compatible-label",
  "prototype.render.compatible-emphasis",
  "prototype.design.no-invented-colors",
  "prototype.design.component-approved",
  "prototype.design.constraint-followed",
  "prototype.design.accessibility-rule-covered"
];

const defaultComponentRender = {
  element: "article",
  variant: "generated-section",
  layout: "stack",
  emphasis: "secondary",
  label_style: "heading"
};

const allowedRenderElements = new Set([
  "article",
  "aside",
  "button",
  "details",
  "div",
  "dl",
  "fieldset",
  "form",
  "header",
  "input",
  "section"
]);

const renderCompatibility = {
  button: {
    labelStyles: new Set(["verb"]),
    emphases: new Set(["primary", "secondary"])
  },
  form: {
    labelStyles: new Set(["label"]),
    emphases: new Set(["input"])
  },
  fieldset: {
    labelStyles: new Set(["label", "option"]),
    emphases: new Set(["input"])
  },
  input: {
    labelStyles: new Set(["label"]),
    emphases: new Set(["input"])
  },
  dl: {
    labelStyles: new Set(["term"]),
    emphases: new Set(["data"])
  },
  details: {
    labelStyles: new Set(["heading", "summary"]),
    emphases: new Set(["secondary", "subtle"])
  }
};

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll("\"", "&quot;");
}

function toTokenVar(token, group) {
  return `--aix-${group}-${String(token).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`;
}

function firstToken(tokens, group, fallback) {
  if (!Array.isArray(tokens?.[group]) || tokens[group].length === 0) {
    return fallback;
  }

  const value = tokens[group][0];
  return `var(${toTokenVar(value, group)})`;
}

function compactDesignContext(system) {
  const context = {};
  [
    "philosophy",
    "brand_personality",
    "content_tone",
    "interaction_rules",
    "motion_rules",
    "generation_constraints",
    "examples"
  ].forEach((field) => {
    if (Array.isArray(system[field]) && system[field].length) {
      context[field] = system[field];
    }
  });

  return Object.keys(context).length ? context : undefined;
}

export function createPrototypeManifest(plan, system, options = {}) {
  const patternIds = [...new Set(plan.sections.map((section) => section.pattern))];
  const componentMap = new Map(system.components.map((component) => [component.id, component]));
  const manifest = {
    version: "0.1.0",
    screen_id: plan.screen_id,
    source_plan: options.planPath,
    source_system: options.systemPath,
    output: {
      format: "static_html",
      entrypoint: "index.html"
    },
    tokens: system.tokens,
    patterns: patternIds.map((id) => ({ id })),
    sections: plan.sections.map((section) => ({
      id: section.id,
      title: section.title,
      pattern: section.pattern,
      components: section.components,
      requirements: section.requirements,
      render: section.components.map((componentId) => ({
        component: componentId,
        ...(componentMap.get(componentId)?.render || defaultComponentRender)
      }))
    })),
    validation_rules: validationRules
  };

  if (system.source) {
    manifest.design_source = system.source;
  }

  const designContext = compactDesignContext(system);
  if (designContext) {
    manifest.design_context = designContext;
  }

  return manifest;
}

function renderTokenCss(tokens) {
  const lines = [];

  Object.entries(tokens || {}).forEach(([group, values]) => {
    if (!Array.isArray(values)) return;
    values.forEach((token, index) => {
      const cssValue = /^#[0-9a-f]{6}$/i.test(token)
        ? token
        : group === "spacing" && /^\d+px$/i.test(token)
          ? token
          : group === "spacing"
            ? `${(index + 1) * 8}px`
            : group === "typography"
              ? "system-ui, sans-serif"
              : "currentColor";
      lines.push(`  ${toTokenVar(token, group)}: ${cssValue};`);
    });
  });

  return lines.join("\n");
}

function renderDesignContext(manifest) {
  if (!manifest.design_context) return "";

  const items = Object.entries(manifest.design_context)
    .flatMap(([field, values]) => {
      return values.map((value) => `<li><strong>${escapeHtml(field.replaceAll("_", " "))}:</strong> ${escapeHtml(value)}</li>`);
    })
    .join("\n");

  if (!items) return "";

  return `<aside class="aix-design-context" aria-label="Design context">
      <h2>Design Context</h2>
      <ul>
        ${items}
      </ul>
    </aside>`;
}

function componentLabel(section, requirement, component) {
  if (component.render?.label_style === "verb") {
    return `Review ${section.title}`;
  }

  if (component.render?.label_style === "status") {
    return `${section.title} status`;
  }

  if (component.render?.label_style === "term") {
    return requirement.replaceAll("_", " ");
  }

  return section.title;
}

function renderComponent(component, section, requirement) {
  const render = component.render || defaultComponentRender;
  const element = render.element || defaultComponentRender.element;
  const role = render.role ? ` role="${escapeHtml(render.role)}"` : "";
  const commonAttrs = `data-aix-component="${escapeHtml(component.id)}" data-aix-render-element="${escapeHtml(element)}" data-aix-render-variant="${escapeHtml(render.variant || defaultComponentRender.variant)}" data-aix-render-layout="${escapeHtml(render.layout || defaultComponentRender.layout)}" data-aix-render-emphasis="${escapeHtml(render.emphasis || defaultComponentRender.emphasis)}"${role}`;
  const label = componentLabel(section, requirement, component);
  const description = component.purpose || `Supports ${requirement.replaceAll("_", " ")}.`;

  if (element === "button") {
    return `<button type="button" class="aix-rendered-component aix-component-action" ${commonAttrs}>${escapeHtml(label)}</button>`;
  }

  if (element === "form") {
    return `<form class="aix-rendered-component aix-component-form" ${commonAttrs}>
              <label>${escapeHtml(label)}
                <input type="text" name="${escapeHtml(requirement)}" placeholder="${escapeHtml(requirement.replaceAll("_", " "))}">
              </label>
            </form>`;
  }

  if (element === "fieldset") {
    return `<fieldset class="aix-rendered-component aix-component-choices" ${commonAttrs}>
              <legend>${escapeHtml(label)}</legend>
              <label><input type="checkbox" name="${escapeHtml(requirement)}"> ${escapeHtml(requirement.replaceAll("_", " "))}</label>
            </fieldset>`;
  }

  if (element === "input" && render.role === "checkbox") {
    return `<label class="aix-rendered-component aix-component-checkbox" ${commonAttrs}>
              <input type="checkbox" name="${escapeHtml(requirement)}"> ${escapeHtml(label)}
            </label>`;
  }

  if (element === "input") {
    return `<label class="aix-rendered-component aix-component-file" ${commonAttrs}>${escapeHtml(label)}
              <input type="file" name="${escapeHtml(requirement)}">
            </label>`;
  }

  if (element === "dl") {
    return `<dl class="aix-rendered-component aix-component-data" ${commonAttrs}>
              <dt>${escapeHtml(label)}</dt>
              <dd>${escapeHtml(description)}</dd>
            </dl>`;
  }

  if (element === "details") {
    return `<details class="aix-rendered-component aix-component-disclosure" ${commonAttrs}>
              <summary>${escapeHtml(label)}</summary>
              <p>${escapeHtml(description)}</p>
            </details>`;
  }

  const tag = ["article", "aside", "div", "header", "section"].includes(element) ? element : "article";
  return `<${tag} class="aix-rendered-component aix-component-surface" ${commonAttrs}>
            <h3>${escapeHtml(label)}</h3>
            <p>${escapeHtml(description)}</p>
          </${tag}>`;
}

export function renderPrototypeHtml(plan, system, manifest) {
  const componentMap = new Map(system.components.map((component) => [component.id, component]));
  const sectionHtml = plan.sections.map((section, index) => {
    const components = section.components.map((componentId, componentIndex) => {
      const component = componentMap.get(componentId) || { id: componentId, purpose: "", render: defaultComponentRender };
      const requirement = section.requirements[componentIndex] || section.requirements[0] || section.id;
      return renderComponent(component, section, requirement);
    }).join("\n");

    const requirements = section.requirements.map((requirement) => {
      return `<li>${escapeHtml(requirement.replaceAll("_", " "))}</li>`;
    }).join("\n");

    return `<section class="aix-section" data-aix-section="${escapeHtml(section.id)}" data-aix-pattern="${escapeHtml(section.pattern)}">
      <h2>${index + 1}. ${escapeHtml(section.title)}</h2>
      <p>${escapeHtml(section.rationale || "Render this section from the approved interface plan.")}</p>
      <div class="aix-section-grid">
        <div class="aix-component-stack">
          ${components}
        </div>
        <div>
          <h3>Requirements</h3>
          <ul>
            ${requirements}
          </ul>
        </div>
      </div>
    </section>`;
  }).join("\n");

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(plan.screen_id)} Prototype</title>
  <style>
:root {
${renderTokenCss(system.tokens)}
}
* {
  box-sizing: border-box;
}
body {
  margin: 0;
  font-family: ${firstToken(system.tokens, "typography", "system-ui, sans-serif")};
  color: ${firstToken(system.tokens, "color", "currentColor")};
  background: ${firstToken(system.tokens, "color", "#ffffff")};
}
.aix-shell {
  max-width: 960px;
  margin: 0 auto;
  padding: ${firstToken(system.tokens, "spacing", "24px")};
}
.aix-header {
  border-bottom: 1px solid ${firstToken(system.tokens, "color", "currentColor")};
  margin-bottom: ${firstToken(system.tokens, "spacing", "16px")};
  padding-bottom: ${firstToken(system.tokens, "spacing", "16px")};
}
.aix-section,
.aix-design-context {
  border: 1px solid ${firstToken(system.tokens, "color", "currentColor")};
  border-radius: 8px;
  margin: ${firstToken(system.tokens, "spacing", "16px")} 0;
  padding: ${firstToken(system.tokens, "spacing", "16px")};
  background: ${firstToken(system.tokens, "color", "#ffffff")};
}
.aix-section-grid {
  display: grid;
  gap: ${firstToken(system.tokens, "spacing", "16px")};
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
}
.aix-component-stack {
  display: grid;
  gap: ${firstToken(system.tokens, "spacing", "16px")};
}
.aix-rendered-component {
  display: block;
  width: 100%;
}
.aix-component-action {
  border: 1px solid ${firstToken(system.tokens, "color", "currentColor")};
  border-radius: 6px;
  padding: ${firstToken(system.tokens, "spacing", "16px")};
  text-align: left;
}
.aix-component-surface,
.aix-component-data,
.aix-component-disclosure,
.aix-component-form,
.aix-component-choices,
.aix-component-file,
.aix-component-checkbox {
  border: 1px solid ${firstToken(system.tokens, "color", "currentColor")};
  border-radius: 6px;
  padding: ${firstToken(system.tokens, "spacing", "16px")};
}
input {
  margin-top: 8px;
  min-height: 36px;
}
button {
  min-height: 44px;
}
  </style>
</head>
<body>
  <div class="aix-shell" data-aix-screen="${escapeHtml(plan.screen_id)}">
    <header class="aix-header">
      <h1>${escapeHtml(plan.user_goal)}</h1>
      <p>Task type: ${escapeHtml(plan.task_type)}. Design system: ${escapeHtml(plan.system)}.</p>
    </header>
    <main>
      ${sectionHtml}
      ${renderDesignContext(manifest)}
    </main>
    <footer>
      <p>Generated from an AIX interface plan. Prototype output is local-only by default.</p>
    </footer>
  </div>
</body>
</html>
`;
}

function addFinding(findings, ruleId, severity, message, extra = {}) {
  findings.push({
    rule_id: ruleId,
    category: extra.category || ruleId.split(".")[1] || "prototype",
    severity,
    message,
    source_path: extra.source_path,
    suggested_fix: extra.suggested_fix,
    selector: extra.selector,
    source: extra.source
  });
}

function cleanFindings(findings) {
  return findings.map((finding) => {
    return Object.fromEntries(
      Object.entries(finding).filter(([, value]) => value !== undefined)
    );
  });
}

function reportFor(prototypeDir, findings) {
  const cleanedFindings = cleanFindings(findings);
  const errors = cleanedFindings.filter((finding) => finding.severity === "error").length;
  const warnings = cleanedFindings.filter((finding) => finding.severity === "warning").length;

  return {
    valid: errors === 0,
    prototype_dir: prototypeDir,
    findings: cleanedFindings,
    summary: {
      errors,
      warnings
    }
  };
}

function renderSourcePath(system, componentId) {
  if (system.source?.path) {
    return `${system.source.path} -> components.${componentId}.render`;
  }

  return `interface-system -> components.${componentId}.render`;
}

function validateRenderMetadata(findings, system) {
  system.components.forEach((component) => {
    if (!component.render) {
      addFinding(findings, "prototype.render.metadata-present", "warning", `Component '${component.id}' has no render metadata and will use the generic article fallback.`, {
        source_path: renderSourcePath(system, component.id),
        suggested_fix: "Add render.element, render.variant, render.layout, render.emphasis, and render.label_style to the component."
      });
      return;
    }

    const element = component.render.element;
    if (element && !allowedRenderElements.has(element)) {
      addFinding(findings, "prototype.render.element-allowed", "error", `Component '${component.id}' uses unsupported render element '${element}'.`, {
        source_path: renderSourcePath(system, component.id),
        suggested_fix: `Use one of: ${[...allowedRenderElements].join(", ")}.`,
        source: { component: component.id, element }
      });
    }

    const compatibility = renderCompatibility[element];
    if (!compatibility) return;

    if (component.render.label_style && !compatibility.labelStyles.has(component.render.label_style)) {
      addFinding(findings, "prototype.render.compatible-label", "error", `Component '${component.id}' uses label style '${component.render.label_style}' that does not match render element '${element}'.`, {
        source_path: renderSourcePath(system, component.id),
        suggested_fix: `Use label_style ${[...compatibility.labelStyles].join(" or ")} for ${element} components.`,
        source: { component: component.id, element, label_style: component.render.label_style }
      });
    }

    if (component.render.emphasis && !compatibility.emphases.has(component.render.emphasis)) {
      addFinding(findings, "prototype.render.compatible-emphasis", "error", `Component '${component.id}' uses emphasis '${component.render.emphasis}' that does not match render element '${element}'.`, {
        source_path: renderSourcePath(system, component.id),
        suggested_fix: `Use emphasis ${[...compatibility.emphases].join(" or ")} for ${element} components.`,
        source: { component: component.id, element, emphasis: component.render.emphasis }
      });
    }
  });
}

function countMatches(text, pattern) {
  return (text.match(pattern) || []).length;
}

function extractAttributeValues(html, attribute) {
  const values = [];
  const pattern = new RegExp(`${attribute}="([^"]+)"`, "g");
  let match;

  while ((match = pattern.exec(html))) {
    values.push(match[1]);
  }

  return values;
}

function extractTokenVars(html) {
  const values = [];
  const pattern = /var\((--aix-[^)]+)\)/g;
  let match;

  while ((match = pattern.exec(html))) {
    values.push(match[1]);
  }

  return values;
}

function allowedTokenVars(system) {
  return new Set(
    Object.entries(system.tokens || {}).flatMap(([group, values]) => {
      return Array.isArray(values) ? values.map((token) => toTokenVar(token, group)) : [];
    })
  );
}

function validatePrototypeHtml(html, manifest, plan, system, prototypeDir) {
  const findings = [];
  validateRenderMetadata(findings, system);

  if (!html.includes(`data-aix-screen="${plan.screen_id}"`)) {
    addFinding(findings, "prototype.plan.screen-mapped", "error", "Generated HTML does not map to the source plan screen.", {
      selector: "[data-aix-screen]",
      source_path: manifest.source_plan,
      suggested_fix: "Regenerate the prototype from the source plan or restore the expected data-aix-screen marker.",
      source: { screen_id: plan.screen_id }
    });
  }

  plan.sections.forEach((section) => {
    const marker = `data-aix-section="${section.id}"`;
    if (countMatches(html, new RegExp(marker.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g")) !== 1) {
      addFinding(findings, "prototype.plan.section-mapped", "error", `Section '${section.id}' is not rendered exactly once.`, {
        selector: `[data-aix-section="${section.id}"]`,
        source_path: manifest.source_plan,
        suggested_fix: "Regenerate the prototype or restore the missing section marker so every plan section appears exactly once.",
        source: { plan_section: section.id }
      });
    }
  });

  const approvedPatterns = new Set(system.patterns.map((pattern) => pattern.id));
  extractAttributeValues(html, "data-aix-pattern").forEach((patternId) => {
    if (!approvedPatterns.has(patternId)) {
      addFinding(findings, "prototype.system.pattern-approved", "error", `Pattern '${patternId}' is not approved by the source system.`, {
        selector: `[data-aix-pattern="${patternId}"]`,
        source_path: manifest.source_system,
        suggested_fix: "Use a pattern listed in the source interface system or update the interface plan.",
        source: { pattern: patternId }
      });
    }
  });

  const approvedComponents = new Set(system.components.map((component) => component.id));
  extractAttributeValues(html, "data-aix-component").forEach((componentId) => {
    if (!approvedComponents.has(componentId)) {
      addFinding(findings, "prototype.system.component-approved", "error", `Component '${componentId}' is not approved by the source system.`, {
        selector: `[data-aix-component="${componentId}"]`,
        source_path: manifest.source_system,
        suggested_fix: "Use an approved component from the source interface system or update the system before scaffolding.",
        source: { component: componentId }
      });
    }
  });

  if (countMatches(html, /<main[\s>]/g) !== 1) {
    addFinding(findings, "prototype.html.semantic-main", "error", "Generated HTML must contain exactly one main landmark.", {
      source_path: `${prototypeDir}/index.html`,
      suggested_fix: "Keep one semantic main element around the prototype content."
    });
  }

  const headingLevels = [...html.matchAll(/<h([1-6])[\s>]/g)].map((match) => Number(match[1]));
  headingLevels.forEach((level, index) => {
    if (index > 0 && level - headingLevels[index - 1] > 1) {
      addFinding(findings, "prototype.html.heading-order", "error", "Generated headings skip a level.", {
        source_path: `${prototypeDir}/index.html`,
        suggested_fix: "Adjust heading levels so they increase by no more than one level at a time.",
        source: { previous: headingLevels[index - 1], current: level }
      });
    }
  });

  [...html.matchAll(/<button\b[^>]*>(.*?)<\/button>/gis)].forEach((match) => {
    if (!match[1].replace(/<[^>]+>/g, "").trim()) {
      addFinding(findings, "prototype.html.button-name", "error", "Button is missing accessible text.", {
        source_path: `${prototypeDir}/index.html`,
        suggested_fix: "Add concise visible text to every button."
      });
    }
  });

  const allowedVars = allowedTokenVars(system);
  extractTokenVars(html).forEach((tokenVar) => {
    if (!allowedVars.has(tokenVar)) {
      addFinding(findings, "prototype.tokens.no-unknown-token", "error", `Unknown design token '${tokenVar}' is referenced.`, {
        source_path: `${prototypeDir}/index.html`,
        suggested_fix: "Replace the token reference with one generated from the source interface system tokens.",
        source: { token: tokenVar }
      });
    }
  });

  const colorValues = [...html.matchAll(/#[0-9a-f]{6}\b/gi)].map((match) => match[0].toLowerCase());
  const approvedColors = new Set((system.tokens.color || []).filter((token) => /^#[0-9a-f]{6}$/i.test(token)).map((token) => token.toLowerCase()));
  colorValues.forEach((color) => {
    if (!approvedColors.has(color)) {
      addFinding(findings, "prototype.design.no-invented-colors", "error", `Color '${color}' is not declared in the source system.`, {
        source_path: `${prototypeDir}/index.html`,
        suggested_fix: "Use a declared color token or add the color to the interface system before scaffolding.",
        source: { color }
      });
    }
  });

  manifest.sections.forEach((section) => {
    section.components.forEach((componentId) => {
      if (!approvedComponents.has(componentId)) {
        addFinding(findings, "prototype.design.component-approved", "error", `Manifest references unapproved component '${componentId}'.`, {
          source_path: `${prototypeDir}/prototype.json`,
          suggested_fix: "Update the manifest by regenerating from a valid interface plan and system.",
          source: { component: componentId }
        });
      }
    });
  });

  if (Array.isArray(system.generation_constraints)) {
    const forbiddenGradient = system.generation_constraints.some((constraint) => /gradient/i.test(constraint));
    if (forbiddenGradient && /linear-gradient|radial-gradient/i.test(html)) {
      addFinding(findings, "prototype.design.constraint-followed", "error", "Generated HTML violates a gradient-related design constraint.", {
        source_path: system.source?.path || manifest.source_system,
        suggested_fix: "Remove gradient CSS or revise the DESIGN.md generation constraint if gradients are intended."
      });
    }
  }

  if (Array.isArray(system.accessibility_rules) && system.accessibility_rules.some((rule) => /color alone/i.test(rule))) {
    if (!/status|state|warning|error|success|validation|readiness/i.test(html)) {
      addFinding(findings, "prototype.design.accessibility-rule-covered", "warning", "Accessibility rules mention status text, but no explicit status language was found.", {
        source_path: manifest.source_system,
        suggested_fix: "Add explicit state or status language, or refine the accessibility rule if it does not apply."
      });
    }
  }

  return reportFor(prototypeDir, findings);
}

function readJsonIfExists(filePath) {
  if (!filePath || !fs.existsSync(filePath)) return undefined;
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function sectionKey(title) {
  return title
    .toLowerCase()
    .replace(/^\d+\.?\s*/, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");
}

function extractDesignMarkdownSections(markdown) {
  const sections = {};
  const headingPattern = /^##\s+(.+)$/gm;
  const matches = [...markdown.matchAll(headingPattern)];

  matches.forEach((match, index) => {
    const start = match.index + match[0].length;
    const end = matches[index + 1]?.index ?? markdown.length;
    const key = sectionKey(match[1]);
    const content = markdown.slice(start, end).trim();

    if (key && content) {
      sections[key] = content;
    }
  });

  return sections;
}

function readDesignMarkdown(system) {
  const designPath = system.source?.type === "design-md" ? system.source.path : undefined;
  if (!designPath) return undefined;

  const resolvedPath = path.resolve(designPath);
  if (!fs.existsSync(resolvedPath)) {
    return {
      available: false,
      path: designPath,
      note: "DESIGN.md source path is recorded on the interface system, but the file was not found locally."
    };
  }

  const markdown = fs.readFileSync(resolvedPath, "utf8");
  return {
    available: true,
    path: designPath,
    sections: extractDesignMarkdownSections(markdown)
  };
}

function resolvePrototypeDir(plan, options = {}) {
  if (options.prototypeDir) return options.prototypeDir;

  const defaultDir = path.join("prototypes", plan.screen_id);
  if (fs.existsSync(defaultDir)) return defaultDir;

  return undefined;
}

export function assemblePrototypeContext(plan, system, options = {}) {
  const prototypeDir = resolvePrototypeDir(plan, options);
  const manifestPath = prototypeDir ? path.join(prototypeDir, "prototype.json") : undefined;
  const reportPath = prototypeDir ? path.join(prototypeDir, "validation-report.json") : undefined;
  const existingManifest = readJsonIfExists(manifestPath);
  const validationReport = readJsonIfExists(reportPath) || null;
  const prototypeManifest = existingManifest || createPrototypeManifest(plan, system, {
    planPath: options.planPath,
    systemPath: options.systemPath
  });

  const sources = {
    plan: options.planPath,
    system: options.systemPath
  };

  if (system.source) {
    sources.design = system.source;
  }

  if (prototypeDir) {
    sources.prototype = prototypeDir;
  }

  if (reportPath && fs.existsSync(reportPath)) {
    sources.validation_report = reportPath;
  }

  const context = {
    version: "0.1.0",
    purpose: "AI-oriented context for prototype generation. This artifact prepares structured context only and does not call an AI model.",
    generation_mode: "deterministic-context",
    sources,
    interface_plan: plan,
    interface_system: system,
    prototype_manifest: prototypeManifest,
    validation_report: validationReport,
    ai_boundary: {
      model_calls: false,
      default_generation: "deterministic",
      allowed_use: [
        "review interface plan traceability",
        "prepare future opt-in AI generation prompts",
        "explain design-system constraints",
        "debug prototype validation findings"
      ]
    }
  };

  const designMarkdown = readDesignMarkdown(system);
  if (designMarkdown) {
    context.design_markdown = designMarkdown;
  }

  return context;
}

export function verifyPrototypeDirectory(prototypeDir, plan, system) {
  const manifestPath = path.join(prototypeDir, "prototype.json");
  const htmlPath = path.join(prototypeDir, "index.html");

  if (!fs.existsSync(manifestPath)) {
    return {
      valid: false,
      prototype_dir: prototypeDir,
      findings: [{
        rule_id: "prototype.manifest.exists",
        category: "manifest",
        severity: "error",
        message: "prototype.json is missing.",
        source_path: path.join(prototypeDir, "prototype.json"),
        suggested_fix: "Run prototype scaffold again to regenerate prototype.json."
      }],
      summary: { errors: 1, warnings: 0 }
    };
  }

  if (!fs.existsSync(htmlPath)) {
    return {
      valid: false,
      prototype_dir: prototypeDir,
      findings: [{
        rule_id: "prototype.html.exists",
        category: "html",
        severity: "error",
        message: "index.html is missing.",
        source_path: path.join(prototypeDir, "index.html"),
        suggested_fix: "Run prototype scaffold again to regenerate index.html."
      }],
      summary: { errors: 1, warnings: 0 }
    };
  }

  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  const html = fs.readFileSync(htmlPath, "utf8");
  return validatePrototypeHtml(html, manifest, plan, system, prototypeDir);
}

export function scaffoldPrototypeFiles(plan, system, options) {
  const outputDir = options.out;

  if (!outputDir) {
    throw new Error("--out is required for prototype scaffold.");
  }

  if (fs.existsSync(outputDir) && !options.force) {
    throw new Error(`Output directory already exists. Use --force to overwrite: ${outputDir}`);
  }

  fs.mkdirSync(outputDir, { recursive: true });

  const manifest = createPrototypeManifest(plan, system, {
    planPath: options.planPath,
    systemPath: options.systemPath
  });
  const html = renderPrototypeHtml(plan, system, manifest);

  fs.writeFileSync(path.join(outputDir, "index.html"), html);
  fs.writeFileSync(path.join(outputDir, "prototype.json"), `${JSON.stringify(manifest, null, 2)}\n`);

  const report = validatePrototypeHtml(html, manifest, plan, system, outputDir);
  fs.writeFileSync(path.join(outputDir, "validation-report.json"), `${JSON.stringify(report, null, 2)}\n`);

  return { manifest, report };
}

export function servePrototypeDirectory(prototypeDir, options = {}) {
  const port = Number.parseInt(options.port || "4173", 10);
  const root = path.resolve(prototypeDir);

  const server = http.createServer((request, response) => {
    const requestPath = request.url === "/" ? "/index.html" : request.url;
    const filePath = path.resolve(root, `.${requestPath}`);

    if (!filePath.startsWith(root)) {
      response.writeHead(403);
      response.end("Forbidden");
      return;
    }

    if (!fs.existsSync(filePath)) {
      response.writeHead(404);
      response.end("Not found");
      return;
    }

    response.writeHead(200, {
      "content-type": filePath.endsWith(".json") ? "application/json" : "text/html"
    });
    response.end(fs.readFileSync(filePath));
  });

  server.listen(port, "127.0.0.1", () => {
    console.log(`Serving prototype at http://127.0.0.1:${port}`);
  });

  return server;
}
