import { describe, test, expect, beforeAll, afterAll } from 'vitest';
import { handleSearchPests } from '../../src/tools/search-pests.js';
import { createSeededDatabase } from '../helpers/seed-db.js';
import type { Database } from '../../src/db.js';
import { existsSync, unlinkSync } from 'fs';

const TEST_DB = 'tests/test-search-pests.db';

describe('search_pests tool', () => {
  let db: Database;

  beforeAll(() => {
    db = createSeededDatabase(TEST_DB);
  });

  afterAll(() => {
    db.close();
    if (existsSync(TEST_DB)) unlinkSync(TEST_DB);
  });

  test('returns results for Blattlaeuse query', () => {
    const result = handleSearchPests(db, { query: 'Blattlaeuse' });
    expect(result).toHaveProperty('results_count');
    expect((result as { results_count: number }).results_count).toBeGreaterThan(0);
  });

  test('returns results for Phytophthora query', () => {
    const result = handleSearchPests(db, { query: 'Phytophthora' });
    expect(result).toHaveProperty('results_count');
    expect((result as { results_count: number }).results_count).toBeGreaterThan(0);
  });

  test('filters by pest_type', () => {
    const result = handleSearchPests(db, { query: 'Blattlaeuse', pest_type: 'insect' });
    expect(result).toHaveProperty('results');
    const results = (result as { results: { pest_type: string }[] }).results;
    for (const r of results) {
      expect(r.pest_type).toBe('insect');
    }
  });

  test('filters by crop', () => {
    const result = handleSearchPests(db, { query: 'Kartoffeln', crop: 'Kartoffeln' });
    expect(result).toHaveProperty('filters');
    expect((result as { filters: { crop: string } }).filters.crop).toBe('Kartoffeln');
  });

  test('rejects unsupported jurisdiction', () => {
    const result = handleSearchPests(db, { query: 'Blattlaeuse', jurisdiction: 'FR' });
    expect(result).toHaveProperty('error', 'jurisdiction_not_supported');
  });

  test('respects limit parameter', () => {
    const result = handleSearchPests(db, { query: 'Blattlaeuse', limit: 1 });
    expect(result).toHaveProperty('results');
    const results = (result as { results: unknown[] }).results;
    expect(results.length).toBeLessThanOrEqual(1);
  });

  test('includes metadata', () => {
    const result = handleSearchPests(db, { query: 'Blattlaeuse' });
    expect(result).toHaveProperty('_meta');
  });
});
