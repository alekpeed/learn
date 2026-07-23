/**
 * Content schema validation (CUR-001).
 * Loads the JSON Schemas under ../schemas and exposes a validator keyed by schema name.
 * This is the single source of truth for content shape + the ID grammar (DEC-007).
 */
import Ajv2020 from 'ajv/dist/2020.js';
import type { ValidateFunction } from 'ajv';
import addFormats from 'ajv-formats';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const schemaDir = join(here, '..', 'schemas');

export const SCHEMA_NAMES = [
  'common',
  'skill',
  'lesson',
  'question',
  'misconception',
  'course',
  'manifest',
] as const;

export type SchemaName = (typeof SCHEMA_NAMES)[number];

/** Top-level (validatable) schemas — `common` holds only shared $defs. */
export const VALIDATABLE_SCHEMAS: readonly SchemaName[] = [
  'skill',
  'lesson',
  'question',
  'misconception',
  'course',
  'manifest',
];

function loadSchema(name: SchemaName): object {
  return JSON.parse(readFileSync(join(schemaDir, `${name}.schema.json`), 'utf8')) as object;
}

function buildAjv(): Ajv2020 {
  const ajv = new Ajv2020({ allErrors: true, strict: false });
  addFormats(ajv);
  // `common` must be registered first so $refs resolve.
  for (const name of SCHEMA_NAMES) {
    ajv.addSchema(loadSchema(name), `${name}.schema.json`);
  }
  return ajv;
}

const ajv = buildAjv();

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export function validateContent(schema: SchemaName, data: unknown): ValidationResult {
  const validate = ajv.getSchema(`${schema}.schema.json`) as ValidateFunction | undefined;
  if (!validate) {
    return { valid: false, errors: [`unknown schema: ${schema}`] };
  }
  const valid = validate(data) as boolean;
  const errors = (validate.errors ?? []).map(
    (e) => `${e.instancePath || '(root)'} ${e.message ?? 'is invalid'}`,
  );
  return { valid, errors };
}

/** ID grammar regexes (DEC-007), also enforced by the schemas. */
export const ID_PATTERNS = {
  subject: /^[a-z][a-z0-9_]*$/,
  unit: /^[a-z][a-z0-9_]*\.[a-z][a-z0-9_]*$/,
  skill: /^[a-z][a-z0-9_]*\.[a-z][a-z0-9_]*\.[a-z][a-z0-9_]*$/,
} as const;
