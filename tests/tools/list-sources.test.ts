import { describe, test, expect, beforeAll, afterAll } from 'vitest';
import { handleListSources } from '../../src/tools/list-sources.js';
import { createDatabase, type Database } from '../../src/db.js';
import { existsSync, unlinkSync } from 'fs';

const TEST_DB = 'tests/test-list-sources.db';

describe('list_sources tool', () => {
  let db: Database;

  beforeAll(() => {
    db = createDatabase(TEST_DB);
  });

  afterAll(() => {
    db.close();
    if (existsSync(TEST_DB)) unlinkSync(TEST_DB);
  });

  test('returns 4 data sources', () => {
    const result = handleListSources(db);
    expect(result.sources).toHaveLength(4);
  });

  test('each source has required fields', () => {
    const result = handleListSources(db);
    for (const source of result.sources) {
      expect(source).toHaveProperty('name');
      expect(source).toHaveProperty('authority');
      expect(source).toHaveProperty('official_url');
      expect(source).toHaveProperty('license');
      expect(source).toHaveProperty('retrieval_method');
      expect(source).toHaveProperty('update_frequency');
    }
  });

  test('includes BLW Pflanzenschutzmittelverzeichnis', () => {
    const result = handleListSources(db);
    const blw = result.sources.find(s => s.name.includes('BLW'));
    expect(blw).toBeDefined();
    expect(blw!.authority).toContain('BLW');
    expect(blw!.official_url).toContain('psm.admin.ch');
  });

  test('includes Agroscope', () => {
    const result = handleListSources(db);
    const agroscope = result.sources.find(s => s.name.includes('Agroscope'));
    expect(agroscope).toBeDefined();
    expect(agroscope!.authority).toBe('Agroscope');
  });

  test('includes _meta', () => {
    const result = handleListSources(db);
    expect(result._meta).toHaveProperty('disclaimer');
    expect(result._meta).toHaveProperty('source_url');
  });
});
