import { buildMeta } from '../metadata.js';
import type { Database } from '../db.js';

interface Source {
  name: string;
  authority: string;
  official_url: string;
  retrieval_method: string;
  update_frequency: string;
  license: string;
  coverage: string;
  last_retrieved?: string;
}

export function handleListSources(db: Database): { sources: Source[]; _meta: ReturnType<typeof buildMeta> } {
  const lastIngest = db.get<{ value: string }>('SELECT value FROM db_metadata WHERE key = ?', ['last_ingest']);

  const sources: Source[] = [
    {
      name: 'BLW Pflanzenschutzmittelverzeichnis',
      authority: 'Bundesamt fuer Landwirtschaft (BLW)',
      official_url: 'https://www.psm.admin.ch/de/produkte',
      retrieval_method: 'STRUCTURED_EXTRACT',
      update_frequency: 'continuous (products added/removed as authorisations change)',
      license: 'Swiss Federal Administration — free reuse',
      coverage: 'Approved plant protection products: W-number, active substance, crops, auflagen, wartefrist',
      last_retrieved: lastIngest?.value,
    },
    {
      name: 'Agroscope Pflanzenschutzempfehlungen / Schadschwellen',
      authority: 'Agroscope',
      official_url: 'https://www.agroscope.admin.ch/agroscope/de/home/themen/pflanzenbau/pflanzenschutz.html',
      retrieval_method: 'PDF_EXTRACT',
      update_frequency: 'annual (updated per growing season)',
      license: 'Swiss Federal Administration — free reuse',
      coverage: 'Damage thresholds, monitoring methods, prognosis systems (PhytoPRE, SOPRA, FusaProg)',
      last_retrieved: lastIngest?.value,
    },
    {
      name: 'AGRIDEA OELN-Pflanzenschutz-Checklisten',
      authority: 'AGRIDEA',
      official_url: 'https://www.agridea.ch/de/themen/pflanzenbau/pflanzenschutz/',
      retrieval_method: 'PDF_EXTRACT',
      update_frequency: 'annual',
      license: 'Public advisory material',
      coverage: 'OELN crop protection requirements, approved products lists (Feldbau, Rebbau, Obstbau)',
      last_retrieved: lastIngest?.value,
    },
    {
      name: 'Aktionsplan Pflanzenschutzmittel',
      authority: 'Bundesrat / BLW',
      official_url: 'https://www.blw.admin.ch/blw/de/home/nachhaltige-produktion/pflanzenschutz/aktionsplan.html',
      retrieval_method: 'PDF_EXTRACT',
      update_frequency: 'periodic (adopted 2017, targets to 2027)',
      license: 'Swiss Federal Administration — free reuse',
      coverage: '50% risk reduction targets, indicators, IPM strategy, buffer zone requirements',
      last_retrieved: lastIngest?.value,
    },
  ];

  return {
    sources,
    _meta: buildMeta(),
  };
}
