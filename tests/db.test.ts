import { describe, test, expect, beforeAll, afterAll } from 'vitest';
import { createDatabase, type Database } from '../src/db.js';
import { existsSync, unlinkSync } from 'fs';

const TEST_DB = 'tests/test-database.db';

describe('database layer', () => {
  let db: Database;

  beforeAll(() => {
    db = createDatabase(TEST_DB);
  });

  afterAll(() => {
    db.close();
    if (existsSync(TEST_DB)) unlinkSync(TEST_DB);
  });

  test('creates database with db_metadata table', () => {
    const row = db.get<{ value: string }>(
      'SELECT value FROM db_metadata WHERE key = ?',
      ['schema_version']
    );
    expect(row?.value).toBe('1.0');
  });

  test('creates pests table', () => {
    const result = db.all<{ name: string }>(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='pests'"
    );
    expect(result).toHaveLength(1);
  });

  test('creates treatments table', () => {
    const result = db.all<{ name: string }>(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='treatments'"
    );
    expect(result).toHaveLength(1);
  });

  test('creates ipm_guidance table', () => {
    const result = db.all<{ name: string }>(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='ipm_guidance'"
    );
    expect(result).toHaveLength(1);
  });

  test('creates approved_products table', () => {
    const result = db.all<{ name: string }>(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='approved_products'"
    );
    expect(result).toHaveLength(1);
  });

  test('FTS5 search_index exists', () => {
    const result = db.all<{ name: string }>(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='search_index'"
    );
    expect(result).toHaveLength(1);
  });

  test('journal mode is DELETE', () => {
    const row = db.get<{ journal_mode: string }>('PRAGMA journal_mode');
    expect(row?.journal_mode).toBe('delete');
  });

  test('mcp_name metadata is set', () => {
    const row = db.get<{ value: string }>(
      'SELECT value FROM db_metadata WHERE key = ?',
      ['mcp_name']
    );
    expect(row?.value).toBe('Switzerland Pest Management MCP');
  });

  test('jurisdiction metadata is CH', () => {
    const row = db.get<{ value: string }>(
      'SELECT value FROM db_metadata WHERE key = ?',
      ['jurisdiction']
    );
    expect(row?.value).toBe('CH');
  });
});
