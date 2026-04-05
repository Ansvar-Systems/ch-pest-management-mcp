export interface Meta {
  disclaimer: string;
  data_age: string;
  source_url: string;
  copyright: string;
  server: string;
  version: string;
}

const DISCLAIMER =
  'Diese Daten dienen ausschliesslich der Information und ersetzen keine professionelle Pflanzenschutzberatung. ' +
  'Vor jeder Anwendung von Pflanzenschutzmitteln (PSM) ist die aktuelle Zulassung im Pflanzenschutzmittelverzeichnis ' +
  'des BLW (psm.admin.ch) zu pruefen. Die Angaben basieren auf dem Pflanzenschutzmittelverzeichnis, den ' +
  'Pflanzenschutzempfehlungen von Agroscope, den OELN-Richtlinien und dem Aktionsplan Pflanzenschutzmittel. ' +
  'Fuer die berufliche Anwendung ist eine Fachbewilligung PSM erforderlich. Pufferstreifen und Auflagen sind ' +
  'eigenstaendig einzuhalten. Kantonale Abweichungen und betriebsspezifische Anpassungen sind zu pruefen. / ' +
  'This data is for informational purposes only and does not replace professional crop protection advice. ' +
  'Before any pesticide application, verify the current authorisation in the BLW Pflanzenschutzmittelverzeichnis ' +
  '(psm.admin.ch). Data sourced from BLW, Agroscope, AGRIDEA, and the Aktionsplan Pflanzenschutzmittel.';

export function buildMeta(overrides?: Partial<Meta>): Meta {
  return {
    disclaimer: DISCLAIMER,
    data_age: overrides?.data_age ?? 'unknown',
    source_url: overrides?.source_url ?? 'https://www.psm.admin.ch/de/produkte',
    copyright: 'Data: BLW, Agroscope, AGRIDEA — used under public-sector information principles. Server: Apache-2.0 Ansvar Systems.',
    server: 'ch-pest-management-mcp',
    version: '0.1.0',
    ...overrides,
  };
}
