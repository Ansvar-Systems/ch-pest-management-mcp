# Changelog

## [0.1.0] - 2026-04-05

### Added

- Initial release with 10 MCP tools (3 meta + 7 domain)
- SQLite + FTS5 database with schema for pests, treatments, IPM guidance, approved products
- Dual transport: stdio (npm) and Streamable HTTP (Docker)
- Jurisdiction validation (CH supported)
- Tiered FTS5 search (phrase > AND > prefix > stemmed > OR > LIKE fallback)
- Data freshness monitoring with 90-day staleness threshold
- Docker image with non-root user, health check
- CI/CD: TypeScript build, lint, test, CodeQL, Gitleaks, GHCR image build, ingestion, freshness check
- Bilingual disclaimer (DE/EN), privacy statement, security policy
- MCP registry (server.json) with public endpoint at mcp.ansvar.eu
