import { buildMeta } from '../metadata.js';
import { buildCitation } from '../citation.js';
import { validateJurisdiction } from '../jurisdiction.js';
import type { Database } from '../db.js';

interface GetApprovedProductsArgs {
  active_substance?: string;
  target_pest?: string;
  crop?: string;
  jurisdiction?: string;
}

export function handleGetApprovedProducts(db: Database, args: GetApprovedProductsArgs) {
  const jv = validateJurisdiction(args.jurisdiction);
  if (!jv.valid) return jv.error;

  let sql = 'SELECT * FROM approved_products WHERE jurisdiction = ?';
  const params: unknown[] = [jv.jurisdiction];

  if (args.active_substance) {
    sql += ' AND LOWER(active_substance) LIKE LOWER(?)';
    params.push(`%${args.active_substance}%`);
  }

  if (args.target_pest) {
    sql += ' AND LOWER(target_organisms) LIKE LOWER(?)';
    params.push(`%${args.target_pest}%`);
  }

  if (args.crop) {
    sql += ' AND LOWER(crops) LIKE LOWER(?)';
    params.push(`%${args.crop}%`);
  }

  sql += ' ORDER BY product_name LIMIT 50';

  const products = db.all<{
    id: number; w_number: string; product_name: string; active_substance: string;
    product_type: string; crops: string; target_organisms: string;
    auflagen: string; wartefrist: string; dosage: string;
    application_method: string; spe3_buffer: string; aktionsplan_status: string;
  }>(sql, params);

  return {
    filters: {
      active_substance: args.active_substance ?? null,
      target_pest: args.target_pest ?? null,
      crop: args.crop ?? null,
    },
    jurisdiction: jv.jurisdiction,
    products_count: products.length,
    products: products.map(p => ({
      w_number: p.w_number,
      product_name: p.product_name,
      active_substance: p.active_substance,
      product_type: p.product_type,
      crops: p.crops,
      target_organisms: p.target_organisms,
      auflagen: p.auflagen,
      wartefrist: p.wartefrist,
      dosage: p.dosage,
      application_method: p.application_method,
      spe3_buffer: p.spe3_buffer,
      aktionsplan_status: p.aktionsplan_status,
    })),
    warning: 'Immer aktuelle Zulassung auf psm.admin.ch pruefen. Fachbewilligung PSM erforderlich.',
    _meta: buildMeta(),
    _citation: buildCitation(
      'CH Approved Plant Protection Products',
      `Swiss approved plant protection products${args.active_substance ? ` (${args.active_substance})` : ''}`,
      'get_approved_products',
      { ...(args.active_substance ? { active_substance: args.active_substance } : {}), ...(args.crop ? { crop: args.crop } : {}) },
      'https://www.psm.admin.ch',
    ),
  };
}
