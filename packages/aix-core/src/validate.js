import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import Ajv from "ajv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const schemaPath = path.resolve(__dirname, "../spec/aix-contract.schema.json");

const schema = JSON.parse(
  fs.readFileSync(schemaPath, "utf8")
);

const ajv = new Ajv({ allErrors: true });
const validate = ajv.compile(schema);

function formatPath(error) {
  const basePath = error.instancePath
    ? error.instancePath.slice(1).replaceAll("/", ".")
    : "contract";

  if (error.keyword === "required") {
    return basePath === "contract"
      ? error.params.missingProperty
      : `${basePath}.${error.params.missingProperty}`;
  }

  return basePath;
}

function formatValidationError(error) {
  const path = formatPath(error);

  if (error.keyword === "additionalProperties") {
    return `${path} contains unsupported field '${error.params.additionalProperty}'.`;
  }

  if (error.keyword === "enum") {
    return `${path} must be one of: ${error.params.allowedValues.join(", ")}.`;
  }

  if (error.keyword === "minItems") {
    return `${path} must contain at least ${error.params.limit} item(s).`;
  }

  if (error.keyword === "minLength") {
    return `${path} must not be empty.`;
  }

  if (error.keyword === "required") {
    return `${path} is required.`;
  }

  if (error.keyword === "type") {
    return `${path} must be ${error.params.type}.`;
  }

  return `${path} ${error.message}.`;
}

export function validateContract(contract) {
  const valid = validate(contract);
  const errors = validate.errors || [];

  return {
    valid,
    errors,
    humanErrors: errors.map(formatValidationError)
  };
}
