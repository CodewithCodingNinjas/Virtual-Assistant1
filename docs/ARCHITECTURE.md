# Architecture

## System overview

```
┌──────────────────────────────────────────────────────────────────────┐
│                            Browser (Client)                            │
│                                                                        │
│   SpeechRecognition  ──►  React (Home.jsx)  ──►  SpeechSynthesis       │
│        (mic in)            wake-word gate         (Hindi/English out)   │
│                                 │                                       │
└─────────────────────────────────┼─────────────────────────────────────┘
                                  │  POST /api/user/asktoassistant
                                  │  (JWT httpOnly cookie)
                                  ▼
┌──────────────────────────────────────────────────────────────────────┐
│                         Express API (Backend)                          │
│                                                                        │
│  isAuth ─► rateLimit ─► askToAssistant controller                      │
│                              │                                          │
│             ┌────────────────┴───────────────────┐                     │
│             ▼                                     ▼                     │
│   Stage 1: Offline ML classifier        Stage 2: LLM fallback          │
│   (Naive Bayes, on-device,              (Gemini, only when             │
│    < 1 ms, no network)                   confidence < 0.75 or          │
│             │                            intent = "general")           │
│             │  high-confidence                    │                     │
│             ▼  command intents                    ▼                     │
│   server-authoritative resolve  ◄── extractJson + schema validation    │
│             │                                                          │
│             ▼                                                          │
│   { type, userInput, response, source }                                │
└──────────────────────────────────────────────────────────────────────┘
        │                         │                       │
        ▼                         ▼                       ▼
   MongoDB (history)        Cloudinary (avatars)     Gemini API
```

## Hybrid intent pipeline (the core design)

The defining architectural decision is a **two-stage hybrid**:

1. **Stage 1 — offline Naive Bayes classifier** (`ml/intentClassifier.js`).
   Every command is first classified on-device in well under a millisecond, with
   zero network calls and zero data leaving the server. If the model is confident
   (`confidence ≥ 0.75`) and the intent is one we can fully resolve locally
   (open app, search, play, date/time/day/month, weather), we answer immediately
   and **never call the LLM**.

2. **Stage 2 — LLM fallback** (`gemini.js`).
   Only low-confidence or open-ended ("general") commands fall through to Gemini.
   Its output is parsed with a brace-balanced extractor and validated against an
   intent whitelist before the server acts on it.

### Why this matters

| Property | Benefit |
|---|---|
| Latency | Common commands resolve in < 1 ms vs. a network round-trip to the LLM |
| Cost | LLM is invoked only when actually needed, cutting paid-API calls |
| Privacy / sovereignty | Routine commands never leave the host — relevant to air-gapped / secure deployments |
| Resilience | If the LLM is unreachable, the offline path still handles most commands |
| Auditability | Every response is tagged with `source: "offline" | "llm"` |

## Server-authoritative facts

Date, time, day, and month are always computed on the server with `moment()`,
never trusted to the model. This removes a whole class of hallucination and keeps
answers correct regardless of which stage produced the intent.

## Request lifecycle (asktoassistant)

1. `isAuth` verifies the JWT cookie → `401` on failure.
2. `rateLimit` enforces 20 requests/user/minute → `429` on excess.
3. Controller validates the command (non-empty string, ≤ 500 chars) → `400`.
4. History is appended and persisted (`await user.save()`).
5. Stage 1 classifier runs; if confident → resolve and return (`source: offline`).
6. Otherwise Stage 2 LLM runs; output extracted + validated → return (`source: llm`).
7. Failure modes return distinct codes: `502` (LLM down), `422` (unparseable).

## Module map

```
Backend/
  ml/
    intentClassifier.js   Naive Bayes model (train/predict/serialize)
    intents.dataset.json  Labeled bilingual corpus (238 samples, 14 intents)
    evaluate.js           k-fold cross-validation + latency benchmark
    report.js             Writes docs/ML_METRICS.md from live metrics
  utils/
    extractJson.js        Safe brace-balanced JSON extraction + schema validation
  middlewares/
    isAuth.js             JWT verification (401 semantics)
    rateLimit.js          In-memory sliding-window limiter
    multer.js             Hardened image upload (random name, type/size limits)
  config/
    db.js                 Mongo connection (URI/URL compatible, fail-fast)
    cookie.js             Environment-aware secure cookie options
    token.js, cloudinary.js
  controllers/
    auth.controller.js    signup/login/logout (correct status codes)
    user.controller.js    hybrid intent pipeline
  __tests__/              node:test unit tests
```
