# Security Considerations

This project handles authentication, user data, file uploads, and a paid external
API. The following controls are in place; the design notes call out trade-offs
relevant to a security-sensitive (e.g. defense) deployment.

## Authentication & sessions
- Passwords hashed with **bcrypt** (cost 10); plaintext is never stored.
- Sessions use a **JWT in an httpOnly cookie** — not readable by JavaScript, which
  mitigates token theft via XSS.
- Cookie flags are **environment-aware** (`config/cookie.js`):
  - Production: `SameSite=None; Secure` (required for cross-origin HTTPS; also the
    only correct setting when frontend and backend are on different domains).
  - Development: `SameSite=Lax`, non-secure (works on `http://localhost`).
- Auth failures return **`401`**, conflicts **`409`** — no information leak via
  generic `500`s, and login uses a single "invalid email or password" message to
  avoid user enumeration.

## Input validation (boundaries)
- `asktoassistant` validates the command is a non-empty string ≤ 500 chars before
  it is forwarded to the LLM.
- Signup validates email format and password length; email uniqueness enforced.
- JSON body capped at 1 MB.

## Abuse / cost protection
- **Rate limiting** on the assistant endpoint (20 req/user/min) protects the paid
  LLM API from runaway or malicious use, returning `429` with `Retry-After`.
- **Offline-first routing** means most commands never reach the paid API at all.

## File uploads
- Uploads are renamed to a **random hex name** (never the client-supplied name),
  preventing path traversal and cross-user overwrite.
- Restricted to **image MIME types**, capped at **5 MB**.
- Temp files are unlinked after Cloudinary upload (success or failure).

## LLM output handling
- Model output is parsed with a **brace-balanced, string-aware extractor**
  (`utils/extractJson.js`) instead of a naive regex + `JSON.parse`, so malformed
  output yields a clean `422` rather than a crash.
- Parsed intents are checked against an **allowlist** (`VALID_INTENTS`); the
  server never acts on an intent type it doesn't recognize.

## Secrets
- `.env` is git-ignored (verified: not tracked). Only `.env.example` is committed.
- `.env.example` key names are aligned with what the code actually reads.
- LLM endpoint/key supplied via env; no secrets in source.

## Known limitations / future hardening
- **Rate limiter is in-memory** (per-process). For multi-instance or serverless
  deployments, back it with Redis so limits are global.
- **CSRF**: cross-site cookies in production should be paired with a CSRF token or
  origin check on state-changing requests.
- **Privacy / data sovereignty**: the LLM fallback sends command text to a
  third-party API. For air-gapped or classified use, run Stage 2 against a
  self-hosted model, or disable it and rely solely on the offline classifier.
- Add account lockout / exponential backoff on repeated failed logins.
