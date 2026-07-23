import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { validateContent, ID_PATTERNS, type SchemaName } from '../src/index.js';

const here = dirname(fileURLToPath(import.meta.url));
const fixturesDir = join(here, '..', 'fixtures');

interface FixtureEntry {
  file: string;
  schema: SchemaName;
  reason?: string;
}
interface FixtureIndex {
  valid: FixtureEntry[];
  invalid: FixtureEntry[];
}

const index = JSON.parse(readFileSync(join(fixturesDir, 'index.json'), 'utf8')) as FixtureIndex;

function load(file: string): unknown {
  return JSON.parse(readFileSync(join(fixturesDir, file), 'utf8'));
}

describe('content schemas (CUR-001)', () => {
  it('accepts every valid fixture', () => {
    for (const entry of index.valid) {
      const result = validateContent(entry.schema, load(entry.file));
      expect(result.errors, `${entry.file}: ${result.errors.join('; ')}`).toEqual([]);
      expect(result.valid).toBe(true);
    }
  });

  it('rejects every invalid fixture', () => {
    for (const entry of index.invalid) {
      const result = validateContent(entry.schema, load(entry.file));
      expect(result.valid, `${entry.file} should fail (${entry.reason})`).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    }
  });

  it('requires a schema_version on the manifest', () => {
    const result = validateContent('manifest', {
      content_version: '0.1.0',
      courses: ['math.core'],
      generated_at: '2026-07-23T00:00:00Z',
    });
    expect(result.valid).toBe(false);
    expect(result.errors.join(' ')).toMatch(/schema_version/);
  });
});

describe('ID grammar (DEC-007)', () => {
  it('accepts canonical IDs and rejects malformed ones', () => {
    expect(ID_PATTERNS.skill.test('math.fractions.add_like_denominators')).toBe(true);
    expect(ID_PATTERNS.skill.test('Math.Fractions.AddLike')).toBe(false);
    expect(ID_PATTERNS.unit.test('math.fractions')).toBe(true);
    expect(ID_PATTERNS.unit.test('math')).toBe(false);
  });
});
