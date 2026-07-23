/**
 * Content schema validation (CUR-001).
 * Imports the JSON Schemas statically so this package is isomorphic (works in
 * Node tests AND the browser bundle — no node:fs). It is the single source of
 * truth for content shape + the ID grammar (DEC-007).
 */
import Ajv2020 from 'ajv/dist/2020.js';
import type { ValidateFunction } from 'ajv';
import addFormats from 'ajv-formats';

import common from '../schemas/common.schema.json' with { type: 'json' };
import skill from '../schemas/skill.schema.json' with { type: 'json' };
import lesson from '../schemas/lesson.schema.json' with { type: 'json' };
import question from '../schemas/question.schema.json' with { type: 'json' };
import misconception from '../schemas/misconception.schema.json' with { type: 'json' };
import course from '../schemas/course.schema.json' with { type: 'json' };
import manifest from '../schemas/manifest.schema.json' with { type: 'json' };

/** Current content-schema version. Bump the major on breaking schema changes. */
export const SCHEMA_VERSION = '1.0.0';

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

const SCHEMAS: Record<SchemaName, object> = {
  common,
  skill,
  lesson,
  question,
  misconception,
  course,
  manifest,
};

function buildAjv(): Ajv2020 {
  const ajv = new Ajv2020({ allErrors: true, strict: false });
  addFormats(ajv);
  // `common` must be registered first so $refs resolve.
  for (const name of SCHEMA_NAMES) {
    ajv.addSchema(SCHEMAS[name], `${name}.schema.json`);
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

/**
 * Check a package manifest's declared schema_version against what this build
 * supports. Compatible when the major versions match (DEC content versioning).
 */
export function isSchemaVersionCompatible(declared: string): boolean {
  const major = (v: string): string => v.split('.')[0] ?? '';
  return major(declared) === major(SCHEMA_VERSION);
}

/** ID grammar regexes (DEC-007), also enforced by the schemas. */
export const ID_PATTERNS = {
  subject: /^[a-z][a-z0-9_]*$/,
  unit: /^[a-z][a-z0-9_]*\.[a-z][a-z0-9_]*$/,
  skill: /^[a-z][a-z0-9_]*\.[a-z][a-z0-9_]*\.[a-z][a-z0-9_]*$/,
} as const;
