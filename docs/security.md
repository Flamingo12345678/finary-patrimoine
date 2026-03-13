# Security & dependency status

## Dependency cleanup completed

A safe dependency refresh was applied with focus on patch/minor upgrades only.

### Fixed

- `next` upgraded from `15.4.6` to `15.5.12`
- `eslint-config-next` upgraded to `15.5.12`
- `npm audit` now reports **0 known vulnerabilities** on the lockfile committed in this repository

This removes the previously reported advisories affecting Next.js 15.4.x, including:
- SSRF via improper middleware redirect handling
- React Flight protocol RCE advisory
- Server Actions source exposure advisory
- multiple DoS advisories on server components / request deserialization / image optimizer

## Remaining security notes

No `npm audit` vulnerabilities remain at the time of this update, but some operational risks still exist because this is an MVP:

1. **Credentials auth only**
   - no MFA
   - no password reset flow
   - demo credentials exist in seeded local development data

2. **CSV import trust model**
   - imports rely on user-provided CSV content
   - validation is present, but there is no deduplication yet
   - malformed business data can still be imported if it passes schema validation

3. **Deployment hardening still depends on platform config**
   - GitHub secrets must be configured correctly
   - production database and auth secrets must be strong and rotated outside the repo

## Recommended next hardening steps

- add rate limiting on API endpoints
- add audit logs for destructive actions and imports
- add password reset and optional MFA
- add import deduplication / idempotency keys
- add branch protection + required CI checks on GitHub
