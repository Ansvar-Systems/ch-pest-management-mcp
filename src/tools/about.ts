import { buildMeta } from '../metadata.js';
import { SUPPORTED_JURISDICTIONS } from '../jurisdiction.js';

export function handleAbout() {
  return {
    name: 'Switzerland Pest Management MCP',
    description:
      'Swiss crop protection and pest management data based on the BLW Pflanzenschutzmittelverzeichnis, ' +
      'Agroscope Pflanzenschutzempfehlungen, OELN-Schadschwellenprinzip, and the Aktionsplan Pflanzenschutzmittel. ' +
      'Covers pests (insects, diseases, weeds), approved products, IPM guidance, damage thresholds, ' +
      'and prognosis systems (PhytoPRE, SOPRA, FusaProg) for Swiss agriculture.',
    version: '0.1.0',
    jurisdiction: [...SUPPORTED_JURISDICTIONS],
    data_sources: [
      'BLW Pflanzenschutzmittelverzeichnis (psm.admin.ch)',
      'Agroscope Pflanzenschutzempfehlungen',
      'AGRIDEA OELN-Checklisten (Feldbau, Rebbau, Obstbau)',
      'Aktionsplan Pflanzenschutzmittel',
    ],
    tools_count: 10,
    links: {
      homepage: 'https://ansvar.eu/open-agriculture',
      repository: 'https://github.com/ansvar-systems/ch-pest-management-mcp',
      mcp_network: 'https://ansvar.ai/mcp',
    },
    _meta: buildMeta(),
  };
}
