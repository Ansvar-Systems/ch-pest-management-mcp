# Tools Reference

## about

Get server metadata: name, version, coverage, data sources, and links.

**Parameters:** None

**Returns:** Server name, version, jurisdiction, data sources list, tool count, links, disclaimer metadata.

**Example:**
```json
{ }
```

---

## list_sources

List all data sources with authority, URL, license, and freshness info.

**Parameters:** None

**Returns:** Array of sources, each with `name`, `authority`, `official_url`, `retrieval_method`, `update_frequency`, `license`, `coverage`, `last_retrieved`.

**Example:**
```json
{ }
```

---

## check_data_freshness

Check when data was last ingested, staleness status, and how to trigger a refresh.

**Parameters:** None

**Returns:**

| Field | Type | Description |
|-------|------|-------------|
| `status` | string | `fresh`, `stale`, or `unknown` |
| `last_ingest` | string or null | ISO date of last ingestion |
| `days_since_ingest` | number or null | Days since last ingestion |
| `staleness_threshold_days` | number | Threshold (90 days) |
| `refresh_command` | string | CLI command to trigger re-ingestion |

**Example:**
```json
{ }
```

---

## search_pests

Search pests, diseases, and weeds affecting Swiss crops. Supports German and English queries. Uses tiered FTS5 search (phrase > AND > prefix > stemmed > OR > LIKE fallback).

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `query` | string | yes | Free-text search (e.g. "Blattlaeuse Weizen", "Septoria") |
| `pest_type` | string | no | Filter by type: `insect`, `disease`, or `weed` |
| `crop` | string | no | Filter by affected crop (e.g. "Winterweizen", "Kartoffeln") |
| `jurisdiction` | string | no | ISO 3166-1 alpha-2 code (default: CH) |
| `limit` | number | no | Max results (default: 20, max: 50) |

**Returns:** Array of matching pests with `title`, `body`, `pest_type`, `crop_category`, `relevance_rank`.

**Example:**
```json
{ "query": "Blattlaeuse", "crop": "Winterweizen" }
```

---

## get_pest_details

Get full profile for a pest: lifecycle, identification, crops affected, and treatments.

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `pest_id` | string | yes | Pest ID from search_pests (e.g. "blattlaeuse", "septoria") |
| `jurisdiction` | string | no | ISO 3166-1 alpha-2 code (default: CH) |

**Returns:** Pest profile with `id`, `name`, `pest_type`, `scientific_name`, `crops_affected` (array), `lifecycle`, `identification`, `damage_description`, plus associated `treatments` array.

**Example:**
```json
{ "pest_id": "blattlaeuse" }
```

---

## get_treatments

Get approved chemical and non-chemical controls for a specific pest. Includes products, active substances, W-numbers, dosage, waiting periods, Pufferstreifen, and OELN alternatives.

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `pest_id` | string | yes | Pest ID (e.g. "rapsglanzkaefer", "krautfaeule") |
| `approach` | string | no | Filter: `chemical`, `biological`, `cultural`, or `mechanical` |
| `jurisdiction` | string | no | ISO 3166-1 alpha-2 code (default: CH) |

**Returns:** Pest info plus array of treatments, each with `approach`, `product_name`, `active_substance`, `w_number`, `dosage`, `waiting_period`, `timing`, `restrictions`, `pufferstreifen`, `notes`.

**Example:**
```json
{ "pest_id": "krautfaeule", "approach": "chemical" }
```

---

## get_ipm_guidance

Get IPM (Integrierter Pflanzenschutz) guidance for a crop: OELN Schadschwellen, monitoring methods, cultural controls, and prognosis systems.

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `crop` | string | yes | Crop name (e.g. "Winterweizen", "Kartoffeln", "Reben", "Apfel") |
| `pest_id` | string | no | Filter to specific pest |
| `jurisdiction` | string | no | ISO 3166-1 alpha-2 code (default: CH) |

**Returns:** Array of guidance entries per pest, each with `threshold` (Schadschwelle), `monitoring_method`, `cultural_controls`, `prognose_system`, `oeln_requirements`.

**Example:**
```json
{ "crop": "Winterweizen" }
```

---

## search_crop_threats

List all pests, diseases, and weeds that threaten a specific crop, with damage thresholds and monitoring advice. Groups results by type (insects, diseases, weeds).

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `crop` | string | yes | Crop name (e.g. "Winterweizen", "Winterraps", "Kartoffeln") |
| `growth_stage` | string | no | Growth stage filter (e.g. "Bestockung", "Bluete") |
| `jurisdiction` | string | no | ISO 3166-1 alpha-2 code (default: CH) |

**Returns:** `total_threats`, breakdown `by_type` (insects/diseases/weeds counts), and `threats` array with `pest_id`, `name`, `pest_type`, `scientific_name`, `damage`, `identification`, `threshold`, `monitoring`, `prognose_system`.

**Example:**
```json
{ "crop": "Kartoffeln" }
```

---

## identify_from_symptoms

Identify a pest, disease, or weed from symptom descriptions. Returns a ranked differential diagnosis.

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `symptoms` | string | yes | Symptom description (e.g. "gelbe Flecken auf Weizenblaettern") |
| `crop` | string | no | Affected crop to narrow results |
| `season` | string | no | Time of year (e.g. "Fruehling", "Sommer") |
| `jurisdiction` | string | no | ISO 3166-1 alpha-2 code (default: CH) |

**Returns:** `possible_matches` array with `pest_id`, `name`, `pest_type`, `scientific_name`, `identification`, `damage_description`, `crops_affected`, plus a recommendation to consult the cantonal Pflanzenschutzfachstelle for uncertain cases.

**Example:**
```json
{ "symptoms": "Frass an Rapsblueten", "crop": "Winterraps" }
```

---

## get_approved_products

Search approved plant protection products (Pflanzenschutzmittel) from the BLW Verzeichnis. At least one filter is recommended.

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `active_substance` | string | no | Active substance name (e.g. "Glyphosat", "Mancozeb") |
| `target_pest` | string | no | Target organism (e.g. "Blattlaeuse", "Pilzkrankheiten") |
| `crop` | string | no | Target crop (e.g. "Winterweizen", "Reben") |
| `jurisdiction` | string | no | ISO 3166-1 alpha-2 code (default: CH) |

**Returns:** Array of products with `w_number`, `product_name`, `active_substance`, `product_type`, `crops`, `target_organisms`, `auflagen`, `wartefrist`, `dosage`, `application_method`, `spe3_buffer`, `aktionsplan_status`. Always includes a warning to verify current authorisation on psm.admin.ch.

**Example:**
```json
{ "active_substance": "Spinosad", "crop": "Kartoffeln" }
```
