# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability, please report it responsibly:

1. **Do NOT open a public issue**
2. Email security@ansvar.eu with:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
3. We will acknowledge within 48 hours and provide a timeline for fix

## Supported Versions

| Version | Supported |
|---------|-----------|
| Latest  | Yes       |

## Security Measures

- All dependencies scanned via CodeQL, Gitleaks, and GitHub Advanced Security
- No secrets stored in code -- all data is public domain
- SQLite database is read-only at runtime
- Container runs as non-root user (nodejs:1001) with health checks
- No external network calls at query time -- all data embedded in SQLite
