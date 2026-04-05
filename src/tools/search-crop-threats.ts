import { buildMeta } from '../metadata.js';
import { validateJurisdiction } from '../jurisdiction.js';
import type { Database } from '../db.js';

interface SearchCropThreatsArgs {
  crop: string;
  growth_stage?: string;
  jurisdiction?: string;
}

export function handleSearchCropThreats(db: Database, args: SearchCropThreatsArgs) {
  const jv = validateJurisdiction(args.jurisdiction);
  if (!jv.valid) return jv.error;

  const cropLower = args.crop.toLowerCase();

  // Find all pests that affect this crop
  const pests = db.all<{
    id: string; name: string; pest_type: string; scientific_name: string;
    crops_affected: string; crop_category: string; lifecycle: string;
    identification: string; damage_description: string;
  }>(
    `SELECT * FROM pests WHERE LOWER(crops_affected) LIKE ? AND jurisdiction = ? ORDER BY pest_type, name`,
    [`%${cropLower}%`, jv.jurisdiction]
  );

  // Get IPM guidance for this crop
  const ipmGuidance = db.all<{
    pest_id: string; threshold: string; monitoring_method: string;
    prognose_system: string;
  }>(
    'SELECT pest_id, threshold, monitoring_method, prognose_system FROM ipm_guidance WHERE LOWER(crop) = ? AND jurisdiction = ?',
    [cropLower, jv.jurisdiction]
  );

  const ipmMap = new Map(ipmGuidance.map(g => [g.pest_id, g]));

  const threats = pests.map(p => {
    const ipm = ipmMap.get(p.id);
    return {
      pest_id: p.id,
      name: p.name,
      pest_type: p.pest_type,
      scientific_name: p.scientific_name,
      crop_category: p.crop_category,
      damage: p.damage_description,
      identification: p.identification,
      threshold: ipm?.threshold ?? null,
      monitoring: ipm?.monitoring_method ?? null,
      prognose_system: ipm?.prognose_system ?? null,
    };
  });

  // Group by pest type
  const byType = {
    insects: threats.filter(t => t.pest_type === 'insect'),
    diseases: threats.filter(t => t.pest_type === 'disease'),
    weeds: threats.filter(t => t.pest_type === 'weed'),
  };

  return {
    crop: args.crop,
    growth_stage: args.growth_stage ?? null,
    jurisdiction: jv.jurisdiction,
    total_threats: threats.length,
    by_type: {
      insects: byType.insects.length,
      diseases: byType.diseases.length,
      weeds: byType.weeds.length,
    },
    threats,
    _meta: buildMeta(),
  };
}
