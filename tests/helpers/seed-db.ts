import { createDatabase, type Database } from '../../src/db.js';

export function createSeededDatabase(dbPath: string): Database {
  const db = createDatabase(dbPath);

  // Pests
  db.run(
    `INSERT INTO pests (id, name, pest_type, scientific_name, crops_affected, crop_category, lifecycle, identification, damage_description, language, jurisdiction)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      'blattlaeuse',
      'Blattlaeuse',
      'insect',
      'Aphidoidea',
      JSON.stringify(['Winterweizen', 'Wintergerste', 'Kartoffeln', 'Reben']),
      'feldbau',
      'Mehrere Generationen pro Saison. Gefluegelte und ungefluegelte Formen. Ueberwinterung als Ei oder als adultes Tier.',
      'Kleine gruene, schwarze oder rote Insekten auf Blattunterseiten und Triebspitzen. Honigtau-Ausscheidungen. Besiedelung oft koloniefoermig.',
      'Saugschaeden an Blaettern und Trieben. Honigtau foerdert Russtaupilze. Virusuebertragung (BYDV bei Getreide).',
      'DE',
      'CH',
    ]
  );

  db.run(
    `INSERT INTO pests (id, name, pest_type, scientific_name, crops_affected, crop_category, lifecycle, identification, damage_description, language, jurisdiction)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      'krautfaeule',
      'Kraut- und Knollenfaeule',
      'disease',
      'Phytophthora infestans',
      JSON.stringify(['Kartoffeln', 'Tomaten']),
      'feldbau',
      'Oomyzet. Primaerinfektionen aus Knollenlagern oder Oosporen im Boden. Epidemische Ausbreitung bei feucht-warmer Witterung.',
      'Braune, oelig wirkende Flecken auf Blaettern, weisser Sporenrasen auf Blattunterseite bei Feuchtigkeit. Stengelfaeule moeglich.',
      'Blattnekrosen, Stengelfaeule, Knollenfaeule. Kann bei fehlender Bekaempfung zu Totalverlust fuehren.',
      'DE',
      'CH',
    ]
  );

  // Treatments
  db.run(
    `INSERT INTO treatments (pest_id, approach, product_name, active_substance, w_number, dosage, waiting_period, timing, restrictions, pufferstreifen, notes, jurisdiction)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      'blattlaeuse',
      'chemical',
      'Pirimor',
      'Pirimicarb',
      'W-1234',
      '0.3 kg/ha',
      '21 Tage',
      'Bei Ueberschreitung der Schadschwelle (Getreide: 60% befallene Halme)',
      'Max. 2 Anwendungen pro Saison. Bienengefaehrlich SPe8.',
      '6 m',
      'Selektives Aphizid. Nuetzlingsschonend gegenueber Marienkaefer.',
      'CH',
    ]
  );

  db.run(
    `INSERT INTO treatments (pest_id, approach, product_name, active_substance, w_number, dosage, waiting_period, timing, restrictions, pufferstreifen, notes, jurisdiction)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      'krautfaeule',
      'chemical',
      'Revus',
      'Mandipropamid',
      'W-5678',
      '0.6 l/ha',
      '7 Tage',
      'Praeventiv ab Reihenschluss oder bei PhytoPRE-Warnung',
      'Max. 4 Anwendungen pro Saison.',
      '6 m',
      'Protektiv und kurativ. Gute Regenfestigkeit.',
      'CH',
    ]
  );

  // IPM guidance
  db.run(
    `INSERT INTO ipm_guidance (crop, crop_category, pest_id, threshold, monitoring_method, cultural_controls, prognose_system, oeln_requirements, notes, jurisdiction)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      'Winterweizen',
      'feldbau',
      'blattlaeuse',
      '60% befallene Halme (BBCH 51-69)',
      'Kescherfaenge oder visuelle Bonitur an 5x10 Halmen pro Feld',
      'Foerderung von Nuetzlingen (Marienkaefer, Schwebfliegen). Bluestreifen anlegen.',
      'SOPRA',
      'Schadschwellenbeachtung obligatorisch. Dokumentation der Bonitur.',
      'OELN: nur bei Ueberschreitung der Schadschwelle behandeln.',
      'CH',
    ]
  );

  db.run(
    `INSERT INTO ipm_guidance (crop, crop_category, pest_id, threshold, monitoring_method, cultural_controls, prognose_system, oeln_requirements, notes, jurisdiction)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      'Kartoffeln',
      'feldbau',
      'krautfaeule',
      'Erste Symptome oder PhytoPRE-Warnung',
      'Regelmaessige Feldkontrolle ab Reihenschluss. PhytoPRE-Prognose beachten.',
      'Resistente Sorten waehlen. Gesundes Pflanzgut. Volunteer-Kartoffeln entfernen.',
      'PhytoPRE',
      'Praeventivbehandlung bei Prognosewarnung zulaessig. Kupfer max. 4 kg/ha pro Jahr.',
      'Wichtigste Kartoffelkrankheit. Fruehzeitige Bekaempfung entscheidend.',
      'CH',
    ]
  );

  // Approved products
  db.run(
    `INSERT INTO approved_products (w_number, product_name, active_substance, product_type, crops, target_organisms, auflagen, wartefrist, dosage, application_method, spe3_buffer, aktionsplan_status, language, jurisdiction)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      'W-1234',
      'Pirimor',
      'Pirimicarb',
      'Insektizid',
      'Getreide, Kartoffeln, Gemuese',
      'Blattlaeuse',
      'SPe8: Bienengefaehrlich. Max. 2 Anwendungen.',
      '21 Tage',
      '0.3 kg/ha',
      'Spritzen',
      '6 m',
      'zugelassen',
      'DE',
      'CH',
    ]
  );

  db.run(
    `INSERT INTO approved_products (w_number, product_name, active_substance, product_type, crops, target_organisms, auflagen, wartefrist, dosage, application_method, spe3_buffer, aktionsplan_status, language, jurisdiction)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      'W-5678',
      'Revus',
      'Mandipropamid',
      'Fungizid',
      'Kartoffeln, Tomaten',
      'Kraut- und Knollenfaeule',
      'Max. 4 Anwendungen pro Saison.',
      '7 Tage',
      '0.6 l/ha',
      'Spritzen',
      '6 m',
      'zugelassen',
      'DE',
      'CH',
    ]
  );

  // FTS5 search index
  db.run(
    `INSERT INTO search_index (title, body, pest_type, crop_category, jurisdiction) VALUES (?, ?, ?, ?, ?)`,
    [
      'Blattlaeuse',
      'Blattlaeuse Aphidoidea Saugschaeden Winterweizen Wintergerste Kartoffeln Reben Honigtau Virusuebertragung BYDV',
      'insect',
      'feldbau',
      'CH',
    ]
  );

  db.run(
    `INSERT INTO search_index (title, body, pest_type, crop_category, jurisdiction) VALUES (?, ?, ?, ?, ?)`,
    [
      'Kraut- und Knollenfaeule',
      'Phytophthora infestans Krautfaeule Knollenfaeule Kartoffeln Tomaten braune Flecken Sporenrasen feucht-warm',
      'disease',
      'feldbau',
      'CH',
    ]
  );

  // Metadata
  db.run("INSERT OR REPLACE INTO db_metadata (key, value) VALUES ('last_ingest', ?)", [new Date().toISOString().split('T')[0]]);

  return db;
}
