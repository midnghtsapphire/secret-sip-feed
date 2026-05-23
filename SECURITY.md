# Security Policy

## Supported scope

Security reports should cover:

- Web application routes in `/src`
- Supabase integration and auth flows
- Supabase edge functions in `/supabase/functions`
- SQL schema and RLS policies in `/supabase/migrations`

## Security controls in place

- Supabase Auth for user identity
- Row Level Security policies on core tables
- Client-side monitoring hooks for security headers and auth failures

## Reporting a vulnerability

Please open a private security report through GitHub Security Advisories for this repository. Include:

1. Impact summary
2. Reproduction steps
3. Affected paths/files
4. Suggested remediation

## Response targets

- Initial triage: within 72 hours
- Mitigation plan: within 7 days for high-severity issues
- Public disclosure: after patch release and verification

