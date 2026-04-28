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

export function validateContract(contract) {
  const valid = validate(contract);

  return {
    valid,
    errors: validate.errors || []
  };
}
