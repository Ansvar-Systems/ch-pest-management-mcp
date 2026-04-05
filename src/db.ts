import BetterSqlite3 from 'better-sqlite3';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

export interface Database {
  get<T>(sql: string, params?: unknown[]): T | undefined;
  all<T>(sql: string, params?: unknown[]): T[];
  run(sql: string, params?: unknown[]): void;
  close(): void;
  readonly instance: BetterSqlite3.Database;
}

export function createDatabase(dbPath?: string): Database {
  const resolvedPath =
    dbPath ??
    join(dirname(fileURLToPath(import.meta.url)), '..', 'data', 'database.db');
  const db = new BetterSqlite3(resolvedPath);

  db.pragma('journal_mode = DELETE');
  db.pragma('foreign_keys = ON');

  initSchema(db);

  return {
    get<T>(sql: string, params: unknown[] = []): T | undefined {
      return db.prepare(sql).get(...params) as T | undefined;
    },
    all<T>(sql: string, params: unknown[] = []): T[] {
      return db.prepare(sql).all(...params) as T[];
    },
    run(sql: string, params: unknown[] = []): void {
      db.prepare(sql).run(...params);
    },
    close(): void {
      db.close();
    },
    get instance() {
      return db;
    },
  };
}

function initSchema(db: BetterSqlite3.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS pests (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      pest_type TEXT NOT NULL CHECK (pest_type IN ('insect', 'disease', 'weed')),
      scientific_name TEXT,
      crops_affected TEXT NOT NULL,
      crop_category TEXT,
      lifecycle TEXT,
      identification TEXT,
      damage_description TEXT,
      language TEXT DEFAULT 'DE',
      jurisdiction TEXT NOT NULL DEFAULT 'CH'
    );

    CREATE TABLE IF NOT EXISTS treatments (
      id INTEGER PRIMARY KEY,
      pest_id TEXT NOT NULL REFERENCES pests(id),
      approach TEXT NOT NULL CHECK (approach IN ('chemical', 'biological', 'cultural', 'mechanical')),
      product_name TEXT,
      active_substance TEXT,
      w_number TEXT,
      dosage TEXT,
      waiting_period TEXT,
      timing TEXT,
      restrictions TEXT,
      pufferstreifen TEXT,
      notes TEXT,
      jurisdiction TEXT NOT NULL DEFAULT 'CH'
    );

    CREATE TABLE IF NOT EXISTS ipm_guidance (
      id INTEGER PRIMARY KEY,
      crop TEXT NOT NULL,
      crop_category TEXT,
      pest_id TEXT REFERENCES pests(id),
      threshold TEXT,
      monitoring_method TEXT,
      cultural_controls TEXT,
      prognose_system TEXT,
      oeln_requirements TEXT,
      notes TEXT,
      jurisdiction TEXT NOT NULL DEFAULT 'CH'
    );

    CREATE TABLE IF NOT EXISTS approved_products (
      id INTEGER PRIMARY KEY,
      w_number TEXT NOT NULL,
      product_name TEXT NOT NULL,
      active_substance TEXT NOT NULL,
      product_type TEXT,
      crops TEXT,
      target_organisms TEXT,
      auflagen TEXT,
      wartefrist TEXT,
      dosage TEXT,
      application_method TEXT,
      spe3_buffer TEXT,
      aktionsplan_status TEXT,
      language TEXT DEFAULT 'DE',
      jurisdiction TEXT NOT NULL DEFAULT 'CH'
    );

    CREATE VIRTUAL TABLE IF NOT EXISTS search_index USING fts5(
      title, body, pest_type, crop_category, jurisdiction
    );

    CREATE TABLE IF NOT EXISTS db_metadata (
      key TEXT PRIMARY KEY,
      value TEXT
    );

    INSERT OR IGNORE INTO db_metadata (key, value) VALUES ('schema_version', '1.0');
    INSERT OR IGNORE INTO db_metadata (key, value) VALUES ('mcp_name', 'Switzerland Pest Management MCP');
    INSERT OR IGNORE INTO db_metadata (key, value) VALUES ('jurisdiction', 'CH');
  `);
}

const FTS_COLUMNS = ['title', 'body', 'pest_type', 'crop_category', 'jurisdiction'];

export function ftsSearch(
  db: Database,
  query: string,
  limit: number = 20
): { title: string; body: string; pest_type: string; crop_category: string; jurisdiction: string; rank: number }[] {
  const { results } = tieredFtsSearch(db, 'search_index', FTS_COLUMNS, query, limit);
  return results as { title: string; body: string; pest_type: string; crop_category: string; jurisdiction: string; rank: number }[];
}

/**
 * Tiered FTS5 search with automatic fallback.
 * Tiers: exact phrase -> AND -> prefix -> stemmed prefix -> OR -> LIKE
 */
export function tieredFtsSearch(
  db: Database,
  table: string,
  columns: string[],
  query: string,
  limit: number = 20
): { tier: string; results: Record<string, unknown>[] } {
  const sanitized = sanitizeFtsInput(query);
  if (!sanitized.trim()) return { tier: 'empty', results: [] };

  const columnList = columns.join(', ');
  const select = `SELECT ${columnList}, rank FROM ${table}`;
  const order = `ORDER BY rank LIMIT ?`;

  // Tier 1: Exact phrase
  const phrase = `"${sanitized}"`;
  let results = tryFts(db, select, table, order, phrase, limit);
  if (results.length > 0) return { tier: 'phrase', results };

  // Tier 2: AND
  const words = sanitized.split(/\s+/).filter(w => w.length > 1);
  if (words.length > 1) {
    const andQuery = words.join(' AND ');
    results = tryFts(db, select, table, order, andQuery, limit);
    if (results.length > 0) return { tier: 'and', results };
  }

  // Tier 3: Prefix
  const prefixQuery = words.map(w => `${w}*`).join(' AND ');
  results = tryFts(db, select, table, order, prefixQuery, limit);
  if (results.length > 0) return { tier: 'prefix', results };

  // Tier 4: Stemmed prefix
  const stemmed = words.map(w => stemWord(w) + '*');
  const stemmedQuery = stemmed.join(' AND ');
  if (stemmedQuery !== prefixQuery) {
    results = tryFts(db, select, table, order, stemmedQuery, limit);
    if (results.length > 0) return { tier: 'stemmed', results };
  }

  // Tier 5: OR
  if (words.length > 1) {
    const orQuery = words.join(' OR ');
    results = tryFts(db, select, table, order, orQuery, limit);
    if (results.length > 0) return { tier: 'or', results };
  }

  // Tier 6: LIKE fallback
  const baseCols = ['name', 'pest_type'];
  const likeConditions = words.map(() =>
    `(${baseCols.map(c => `${c} LIKE ?`).join(' OR ')})`
  ).join(' AND ');
  const likeParams = words.flatMap(w =>
    baseCols.map(() => `%${w}%`)
  );
  try {
    const likeResults = db.all<Record<string, unknown>>(
      `SELECT name as title, COALESCE(identification, '') as body, pest_type, COALESCE(crop_category, '') as crop_category, jurisdiction FROM pests WHERE ${likeConditions} LIMIT ?`,
      [...likeParams, limit]
    );
    if (likeResults.length > 0) return { tier: 'like', results: likeResults };
  } catch {
    // LIKE fallback failed
  }

  return { tier: 'none', results: [] };
}

function tryFts(
  db: Database, select: string, table: string,
  order: string, matchExpr: string, limit: number
): Record<string, unknown>[] {
  try {
    return db.all(
      `${select} WHERE ${table} MATCH ? ${order}`,
      [matchExpr, limit]
    );
  } catch {
    return [];
  }
}

function sanitizeFtsInput(query: string): string {
  return query
    .replace(/["\u201C\u201D\u2018\u2019\u201A\u201E\u2039\u203A]/g, '"')
    .replace(/[^a-zA-Z0-9\s*"_\u00C0-\u024F-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function stemWord(word: string): string {
  return word
    .replace(/(ung|heit|keit|lich|isch|ieren|tion|ment|ness|able|ible|ous|ive|ing|ers|ed|es|er|en|ly|s)$/i, '');
}
