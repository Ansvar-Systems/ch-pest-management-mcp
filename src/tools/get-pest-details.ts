import { buildMeta } from '../metadata.js';
import { validateJurisdiction } from '../jurisdiction.js';
import type { Database } from '../db.js';

interface PestDetailsArgs {
  pest_id: string;
  jurisdiction?: string;
}

export function handleGetPestDetails(db: Database, args: PestDetailsArgs) {
  const jv = validateJurisdiction(args.jurisdiction);
  if (!jv.valid) return jv.error;

  const pest = db.get<{
    id: string; name: string; pest_type: string; scientific_name: string;
    crops_affected: string; crop_category: string; lifecycle: string;
    identification: string; damage_description: string; language: string;
    jurisdiction: string;
  }>(
    'SELECT * FROM pests WHERE (id = ? OR LOWER(name) = LOWER(?)) AND jurisdiction = ?',
    [args.pest_id, args.pest_id, jv.jurisdiction]
  );

  if (!pest) {
    return { error: 'not_found', message: `Pest '${args.pest_id}' not found. Use search_pests to find pest IDs.` };
  }

  const treatments = db.all<{
    approach: string; product_name: string; active_substance: string;
    w_number: string; dosage: string; waiting_period: string;
    timing: string; restrictions: string; pufferstreifen: string; notes: string;
  }>(
    'SELECT approach, product_name, active_substance, w_number, dosage, waiting_period, timing, restrictions, pufferstreifen, notes FROM treatments WHERE pest_id = ? AND jurisdiction = ?',
    [pest.id, jv.jurisdiction]
  );

  return {
    ...pest,
    crops_affected: pest.crops_affected ? JSON.parse(pest.crops_affected) : [],
    treatments_count: treatments.length,
    treatments,
    _meta: buildMeta(),
  };
}
