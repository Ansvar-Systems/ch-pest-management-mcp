# Coverage

## Jurisdiction

Switzerland (CH) only.

## Dataset Summary

| Category | Count |
|----------|-------|
| Pests (total) | 23 |
| -- Insects | 9 |
| -- Diseases | 8 |
| -- Weeds | 6 |
| Treatments | 30 |
| IPM guidance records | 12 |
| Approved products | 14 |
| Prognosis systems | 4 |
| Crop categories | 4 |
| Tools | 10 |

## Crop Categories

- **Feldbau** (field crops): Winterweizen, Wintergerste, Winterraps, Kartoffeln, Zuckerrueben, Mais
- **Rebbau** (viticulture): Reben
- **Obstbau** (fruit): Apfel, Kirsche, Zwetschge
- **Gemuese** (vegetables): Karotten, Salat, Zwiebeln

## Prognosis Systems

| System | Scope | URL |
|--------|-------|-----|
| PhytoPRE | Krautfaeule (potato/tomato late blight) | https://www.phytopre.ch |
| SOPRA | Insect flight forecasting | https://www.sopra.info |
| FusaProg | Fusarium risk in cereals | https://www.fusaprog.ch |
| VitiMeteo | Vine disease forecasting | https://www.vitimeteo.info |

## What Is Covered

- Pest identification: names (DE), scientific names, lifecycle, damage descriptions, visual identification cues
- Treatment recommendations: chemical products (W-number, active substance, dosage, waiting period, buffer zone) and non-chemical alternatives (biological, cultural, mechanical)
- IPM guidance: OELN Schadschwellen (damage thresholds), monitoring methods, cultural controls, prognosis system references
- Approved products: BLW Pflanzenschutzmittelverzeichnis entries with Auflagen and Aktionsplan status
- Symptom-based differential diagnosis

## What Is NOT Covered

- Real-time prognosis data (PhytoPRE, SOPRA, FusaProg, VitiMeteo provide real-time data on their own portals -- this MCP references the systems but does not replicate live forecasts)
- Cantonal deviations (some cantons have additional restrictions beyond federal OELN rules)
- Organic-specific rules (Bio Suisse, Demeter -- only OELN/IP-Suisse requirements are included)
- Seed treatment products (Beizmittel)
- Fertiliser interactions with pest management
- Veterinary pest control (livestock parasites)
- Forest pest management (Eidg. Forschungsanstalt WSL scope)

## Limitations

- Product authorisations change frequently. Always verify current status on [psm.admin.ch](https://www.psm.admin.ch/de/produkte)
- Professional use of plant protection products requires a Fachbewilligung PSM
- Schadschwellen values are reference values from Agroscope -- field conditions vary
- FTS search works best with German terms; English terms have partial coverage
- Dataset is a curated subset, not a complete mirror of BLW or Agroscope databases

## Data Freshness

Run `check_data_freshness` to see the ingestion date. Threshold for staleness: 90 days. Re-ingestion: `gh workflow run ingest.yml`.
