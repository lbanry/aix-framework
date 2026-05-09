import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import Ajv from "ajv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const specDir = path.resolve(__dirname, "../spec");

const schemaFiles = {
  system: "interface-system.schema.json",
  research: "research-findings.schema.json",
  requirement: "interface-requirement.schema.json",
  plan: "interface-plan.schema.json"
};

const ajv = new Ajv({ allErrors: true });
const validators = Object.fromEntries(
  Object.entries(schemaFiles).map(([type, filename]) => {
    const schemaPath = path.join(specDir, filename);
    const schema = JSON.parse(fs.readFileSync(schemaPath, "utf8"));
    return [type, ajv.compile(schema)];
  })
);

function formatPath(error, label) {
  const basePath = error.instancePath
    ? error.instancePath.slice(1).replaceAll("/", ".")
    : label;

  if (error.keyword === "required") {
    return basePath === label
      ? error.params.missingProperty
      : `${basePath}.${error.params.missingProperty}`;
  }

  return basePath;
}

function formatValidationError(error, label) {
  const fieldPath = formatPath(error, label);

  if (error.keyword === "additionalProperties") {
    return `${fieldPath} contains unsupported field '${error.params.additionalProperty}'.`;
  }

  if (error.keyword === "enum") {
    return `${fieldPath} must be one of: ${error.params.allowedValues.join(", ")}.`;
  }

  if (error.keyword === "minItems") {
    return `${fieldPath} must contain at least ${error.params.limit} item(s).`;
  }

  if (error.keyword === "minLength") {
    return `${fieldPath} must not be empty.`;
  }

  if (error.keyword === "required") {
    return `${fieldPath} is required.`;
  }

  if (error.keyword === "type") {
    return `${fieldPath} must be ${error.params.type}.`;
  }

  return `${fieldPath} ${error.message}.`;
}

export function validateInterfaceArtifact(type, value) {
  const validator = validators[type];

  if (!validator) {
    throw new Error(`Unknown interface artifact type: ${type}`);
  }

  const valid = validator(value);
  const errors = validator.errors || [];

  return {
    valid,
    errors,
    humanErrors: errors.map((error) => formatValidationError(error, type))
  };
}
