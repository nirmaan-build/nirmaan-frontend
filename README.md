# Nirmaan

B2B hardware/construction marketplace. v1 MVP — single-region launch (Dehradun + Haridwar, Uttarakhand).

Monorepo. The canonical Prisma schema and the PRD docs are the shared source of truth — no app defines its own duplicate types for the same entities.

## Structure (PRD-05 §2)

```
Nirmaan/
├── apps/
│   ├── backend/          NestJS — single REST API, owns the database
│   │   └── prisma/
│   │       └── schema.prisma   ← canonical schema (do not re-derive from PRD text)
│   ├── mobile/           React Native (Android + iOS)
│   ├── web/              Next.js (mobile-first, SEO surface)
│   └── admin/            Next.js (desktop-first, internal ops)
├── packages/
│   └── shared/           shared types / API client / validation schemas (optional)
├── docs/
│   └── prd/              PRD-00..05 — the spec every app points back to
└── README.md
```

## Build order (PRD-05 §1)

Build each stage fully and runnable before starting the next:

0. **Repo & DB** — Supabase project + `schema.prisma` migrated  ✅
1. Backend core — Auth (OTP + Google), Users, Areas  ✅
2. Backend marketplace logic — Catalog, RFQ, Lead, Quote, Cart  ✅
3. Admin Panel (thin) — categories CRUD + activate a pincode  ✅
4. Mobile app — Auth → Onboarding → Tabs → RFQ flow  ✅
5. Web app — same flows, SSR'd Home/Categories  ✅
6. Admin Panel (full) — verification, moderation, broadcast  ✅

> All six build stages complete. Canonical i18n shared via `packages/shared`. See `docs/V1-OUT-OF-SCOPE.md` for what's intentionally deferred.

## Stage 0 — setup

See `apps/backend/README.md` for the database setup and migration steps.

## Guardrails (PRD-05 §5)

- Use `schema.prisma` as provided; don't regenerate it from the PRD prose.
- Build Stage N fully before starting Stage N+1.
- Anything marked "out of scope for v1" in a PRD is not built unless explicitly requested.
- Flag — don't silently resolve — any conflict between PRDs.
