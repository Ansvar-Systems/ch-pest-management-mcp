import { buildMeta } from '../metadata.js';
import { validateJurisdiction } from '../jurisdiction.js';
import type { Database } from '../db.js';

interface GetTreatmentsArgs {
  pest_id: string;
  approach?: string;
  jurisdiction?: string;
}

export function handleGetTreatments(db: Database, args: GetTreatmentsArgs) {
  const jv = validateJurisdiction(args.jurisdiction);
  if (!jv.valid) return jv.error;

  // Verify pest exists
  const pest = db.get<{ id: string; name: string; pest_type: string }>(
    'SELECT id, name, pest_type FROM pests WHERE (id = ? OR LOWER(name) = LOWER(?)) AND jurisdiction = ?',
    [args.pest_id, args.pest_id, jv.jurisdiction]
  );

  if (!pest) {
    return { error: 'not_found', message: `Pest '${args.pest_id}' not found. Use search_pests to find pest IDs.` };
  }

  let sql = 'SELECT * FROM treatments WHERE pest_id = ? AND jurisdiction = ?';
  const params: unknown[] = [pest.id, jv.jurisdiction];

  if (args.approach) {
    sql += ' AND approach = ?';
    params.push(args.approach.toLowerCase());
  }

  const treatments = db.all<{
    id: number; pest_id: string; approach: string; product_name: string;
    active_substance: string; w_number: string; dosage: string;
    waiting_period: string; timing: string; restrictions: string;
    pufferstreifen: string; notes: string;
  }>(sql, params);

  return {
    pest_id: pest.id,
    pest_name: pest.name,
    pest_type: pest.pest_type,
    approach_filter: args.approach ?? 'all',
    jurisdiction: jv.jurisdiction,
    treatments_count: treatments.length,
    treatments: treatments.map(t => ({
      approach: t.approach,
      product_name: t.product_name,
      active_substance: t.active_substance,
      w_number: t.w_number,
      dosage: t.dosage,
      waiting_period: t.waiting_period,
      timing: t.timing,
      restrictions: t.restrictions,
      pufferstreifen: t.pufferstreifen,
      notes: t.notes,
    })),
    _meta: buildMeta(),
  };
}
