# Switzerland Pest Management MCP

MCP server for Swiss crop protection and pest management data. Covers pests (insects, diseases, weeds), approved plant protection products from the BLW Pflanzenschutzmittelverzeichnis, IPM (Integrierter Pflanzenschutz) guidance with OELN Schadschwellen, and prognosis systems (PhytoPRE, SOPRA, FusaProg, VitiMeteo).

Built on data from the Bundesamt fuer Landwirtschaft (BLW), Agroscope, AGRIDEA, and the Aktionsplan Pflanzenschutzmittel.

## Quick Start

### npx (stdio)

```bash
npx -y @ansvar/ch-pest-management-mcp
```

### Docker (Streamable HTTP)

```bash
docker run -p 3000:3000 ghcr.io/ansvar-systems/ch-pest-management-mcp:latest
```

### Public endpoint (Streamable HTTP, no auth)

```
https://mcp.ansvar.eu/ch-pest-management/mcp
```

## Tools

10 tools covering pest identification, treatment lookup, IPM guidance, approved products, and data provenance.

| Tool | Description |
|------|-------------|
| `about` | Server metadata, version, coverage, data sources |
| `list_sources` | All data sources with authority, URL, license, freshness |
| `check_data_freshness` | Ingestion date, staleness status, refresh command |
| `search_pests` | FTS5 search across pests, diseases, weeds (DE/EN) |
| `get_pest_details` | Full pest profile: lifecycle, identification, treatments |
| `get_treatments` | Chemical and non-chemical controls for a pest |
| `get_ipm_guidance` | IPM guidance per crop: Schadschwellen, monitoring, OELN |
| `search_crop_threats` | All pests/diseases/weeds threatening a crop |
| `identify_from_symptoms` | Differential diagnosis from symptom descriptions |
| `get_approved_products` | BLW-approved products: W-number, substances, Auflagen |

Full parameter documentation: [TOOLS.md](TOOLS.md)

## Coverage

- **Jurisdiction:** Switzerland (CH)
- **Pests:** 23 (9 insects, 8 diseases, 6 weeds)
- **Treatments:** 30
- **IPM guidance records:** 12
- **Approved products:** 14
- **Prognosis systems:** PhytoPRE, SOPRA, FusaProg, VitiMeteo
- **Crop categories:** Feldbau, Rebbau, Obstbau, Gemuese
- **Languages:** German (primary), English search supported

Full coverage breakdown: [COVERAGE.md](COVERAGE.md)

## Data Sources

| Source | Authority | URL |
|--------|-----------|-----|
| Pflanzenschutzmittelverzeichnis | BLW | https://www.psm.admin.ch/de/produkte |
| Pflanzenschutzempfehlungen | Agroscope | https://www.agroscope.admin.ch |
| OELN-Pflanzenschutz-Checklisten | AGRIDEA | https://www.agridea.ch |
| Aktionsplan Pflanzenschutzmittel | Bundesrat / BLW | https://www.blw.admin.ch |

## Development

```bash
npm install
npm run build
npm test
npm run lint
```

### Re-ingest data

```bash
npm run ingest          # incremental
npm run ingest:full     # full rebuild
npm run freshness:check # check staleness
```

## License

Apache-2.0. See [LICENSE](LICENSE).

Data sourced from Swiss federal authorities under public-sector information principles.

## Links

- [Ansvar MCP Network](https://ansvar.ai/mcp)
- [TOOLS.md](TOOLS.md) -- full tool documentation
- [COVERAGE.md](COVERAGE.md) -- dataset coverage
- [DISCLAIMER.md](DISCLAIMER.md) -- legal disclaimer (DE/EN)
- [SECURITY.md](SECURITY.md) -- vulnerability reporting
- [PRIVACY.md](PRIVACY.md) -- privacy statement
