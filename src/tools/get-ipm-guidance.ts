import { buildMeta } from '../metadata.js';
import { buildCitation } from '../citation.js';
import { validateJurisdiction } from '../jurisdiction.js';
import type { Database } from '../db.js';

interface GetIpmGuidanceArgs {
  crop: string;
  pest_id?: string;
  jurisdiction?: string;
}

export function handleGetIpmGuidance(db: Database, args: GetIpmGuidanceArgs) {
  const jv = validateJurisdiction(args.jurisdiction);
  if (!jv.valid) return jv.error;

  let sql = 'SELECT g.*, p.name as pest_name, p.pest_type FROM ipm_guidance g LEFT JOIN pests p ON g.pest_id = p.id WHERE LOWER(g.crop) = LOWER(?) AND g.jurisdiction = ?';
  const params: unknown[] = [args.crop, jv.jurisdiction];

  if (args.pest_id) {
    sql += ' AND g.pest_id = ?';
    params.push(args.pest_id);
  }

  const guidance = db.all<{
    id: number; crop: string; crop_category: string; pest_id: string;
    pest_name: string; pest_type: string; threshold: string;
    monitoring_method: string; cultural_controls: string;
    prognose_system: string; oeln_requirements: string; notes: string;
  }>(sql, params);

  if (guidance.length === 0) {
    return {
      error: 'not_found',
      message: `No IPM guidance found for crop '${args.crop}'${args.pest_id ? ` and pest '${args.pest_id}'` : ''}. Try search_pests or search_crop_threats to find valid identifiers.`,
    };
  }

  return {
    crop: args.crop,
    pest_filter: args.pest_id ?? null,
    jurisdiction: jv.jurisdiction,
    guidance_count: guidance.length,
    guidance: guidance.map(g => ({
      pest_id: g.pest_id,
      pest_name: g.pest_name,
      pest_type: g.pest_type,
      crop_category: g.crop_category,
      threshold: g.threshold,
      monitoring_method: g.monitoring_method,
      cultural_controls: g.cultural_controls,
      prognose_system: g.prognose_system,
      oeln_requirements: g.oeln_requirements,
      notes: g.notes,
    })),
    _meta: buildMeta(),
    _citation: buildCitation(
      `CH IPM Guidance — ${args.crop}`,
      `Swiss IPM guidance for ${args.crop}`,
      'get_ipm_guidance',
      { crop: args.crop, ...(args.pest_id ? { pest_id: args.pest_id } : {}) },
    ),
  };
}
