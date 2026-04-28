import fs from "fs";
import Ajv from "ajv";

const schema = JSON.parse(
  fs.readFileSync("./spec/aix-contract.schema.json", "utf8")
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