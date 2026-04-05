import { buildMeta } from '../metadata.js';
import { validateJurisdiction } from '../jurisdiction.js';
import { ftsSearch, type Database } from '../db.js';

interface SearchPestsArgs {
  query: string;
  pest_type?: string;
  crop?: string;
  jurisdiction?: string;
  limit?: number;
}

export function handleSearchPests(db: Database, args: SearchPestsArgs) {
  const jv = validateJurisdiction(args.jurisdiction);
  if (!jv.valid) return jv.error;

  const limit = Math.min(args.limit ?? 20, 50);
  let results = ftsSearch(db, args.query, limit);

  if (args.pest_type) {
    results = results.filter(r => r.pest_type.toLowerCase() === args.pest_type!.toLowerCase());
  }

  if (args.crop) {
    const cropLower = args.crop.toLowerCase();
    results = results.filter(r =>
      r.body.toLowerCase().includes(cropLower) ||
      r.crop_category?.toLowerCase().includes(cropLower)
    );
  }

  return {
    query: args.query,
    jurisdiction: jv.jurisdiction,
    filters: {
      pest_type: args.pest_type ?? null,
      crop: args.crop ?? null,
    },
    results_count: results.length,
    results: results.map(r => ({
      title: r.title,
      body: r.body,
      pest_type: r.pest_type,
      crop_category: r.crop_category,
      relevance_rank: r.rank,
    })),
    _meta: buildMeta(),
  };
}
