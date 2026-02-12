# Security Policy

## Zero Knowledge Architecture

HOLD is designed with a **Zero Knowledge Architecture**. This means:
1. **Server-Side Blindness**: The server (Firebase/Firestore) never sees your passwords, your unencrypted data, or even the metadata (categories, statuses, dates) of your holds.
2. **Client-Side Encryption**: All sensitive data is encrypted in your browser using the Web Crypto API (`AES-GCM` with a 256-bit key).
3. **Key Derivation**: Keys are derived from your password using `PBKDF2-SHA256` with 600,000 iterations. Keys are kept in memory and never stored on disk.
4. **Data Integrity**: Every record is signed with an `HMAC-SHA256` signature. The app verifies these signatures before showing you data to protect against server-side tampering.

## Reporting a Vulnerability

We take security seriously. If you discover a security vulnerability within this project, please report it via the following process:

1. **Do not** open a public GitHub issue for security vulnerabilities.
2. Email the maintainers at security@example.com (replace with real email) with a detailed description of the issue.
3. We will acknowledge your report within 48 hours and coordinate a fix.

## Security Practices

- **Code Audits**: We welcome security researchers to audit our client-side cryptographic implementation in `src/lib/security.ts` and `src/lib/HoldsContext.tsx`.
- **Dependency Management**: We use `npm audit` and stay up to date with security patches for our small set of critical dependencies.
- **No Third-Party Analytics**: HOLD does not use third-party tracking or analytics that could leak your usage patterns.
