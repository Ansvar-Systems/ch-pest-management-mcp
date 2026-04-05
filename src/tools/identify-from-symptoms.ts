import { buildMeta } from '../metadata.js';
import { validateJurisdiction } from '../jurisdiction.js';
import { ftsSearch, type Database } from '../db.js';

interface IdentifyArgs {
  symptoms: string;
  crop?: string;
  season?: string;
  jurisdiction?: string;
}

export function handleIdentifyFromSymptoms(db: Database, args: IdentifyArgs) {
  const jv = validateJurisdiction(args.jurisdiction);
  if (!jv.valid) return jv.error;

  // Use FTS to search symptoms + identification descriptions
  let results = ftsSearch(db, args.symptoms, 30);

  // Filter by crop if provided
  if (args.crop) {
    const cropLower = args.crop.toLowerCase();
    results = results.filter(r =>
      r.body.toLowerCase().includes(cropLower) ||
      r.crop_category?.toLowerCase().includes(cropLower)
    );
  }

  // Get full pest details for top matches
  const pestIds = results.slice(0, 10).map(r => {
    // Extract pest ID from the title (format: "PestName — Type")
    const pest = db.get<{ id: string; name: string; pest_type: string; scientific_name: string; identification: string; damage_description: string; crops_affected: string }>(
      `SELECT id, name, pest_type, scientific_name, identification, damage_description, crops_affected FROM pests WHERE LOWER(name) = LOWER(?) OR LOWER(identification) LIKE LOWER(?) LIMIT 1`,
      [r.title.split(' — ')[0], `%${r.title.split(' — ')[0]}%`]
    );
    return pest;
  }).filter(Boolean);

  // De-duplicate
  const seen = new Set<string>();
  const matches = pestIds.filter(p => {
    if (!p || seen.has(p.id)) return false;
    seen.add(p.id);
    return true;
  });

  return {
    symptoms: args.symptoms,
    crop_filter: args.crop ?? null,
    season: args.season ?? null,
    jurisdiction: jv.jurisdiction,
    matches_count: matches.length,
    possible_matches: matches.map(p => ({
      pest_id: p!.id,
      name: p!.name,
      pest_type: p!.pest_type,
      scientific_name: p!.scientific_name,
      identification: p!.identification,
      damage_description: p!.damage_description,
      crops_affected: p!.crops_affected ? JSON.parse(p!.crops_affected) : [],
    })),
    recommendation: 'Bei Unsicherheit kantonale Pflanzenschutzfachstelle oder AGRIDEA kontaktieren. Bestimmung durch Fachperson empfohlen.',
    _meta: buildMeta(),
  };
}
