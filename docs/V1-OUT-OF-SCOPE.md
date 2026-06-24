# Nirmaan v1 — Deferred / Out-of-Scope Checklist

What was **deliberately not built**, so nothing is discovered by accident. Two
kinds: (A) features the PRDs explicitly marked "out of scope for v1", and (B)
build-time stubs/simplifications flagged during the staged build. Plus (C) the one
stage not yet built.

## A. Explicitly out of scope for v1 (per the PRDs)

**Commerce / money (PRD-00 §6, PRD-02 §5, PRD-03 §7)**
- [ ] Payments / escrow / in-app checkout
- [ ] Server-side payment processing
- [ ] Credit referral / NBFC integration
- [ ] Supplier subscription billing

**Marketplace features (PRD-00 §6)**
- [ ] Ratings / reviews system
- [ ] Radius-based (non-pincode) geofencing — v1 is pincode-equality; centroids stored as floats for the future v1.1 PostGIS upgrade

**Mobile (PRD-02 §5)**
- [ ] iOS-exclusive features / design deviations (iOS only at parity with Android)
- [ ] Biometric login
- [ ] Push-notification rich actions (quick-reply from the tray)

**Web (PRD-03 §7)**
- [ ] Full desktop-optimized redesign (mobile-first reflows for desktop in v1)
- [ ] PWA / installable web app

**Admin (PRD-04 §6, §5)**
- [ ] Analytics / BI dashboards beyond the basic §4.1 metrics
- [ ] Automated supplier KYC / document verification (v1 verification is manual)
- [ ] Role-based permission tiers (single shared admin login in v1)
- [ ] Bulk CSV import / export tools

**Backend (PRD-01)**
- [ ] Background job queue (BullMQ + Redis) — matching runs synchronously until volume justifies a queue (§7.1)
- [ ] In-app VoIP — v1 is tap-to-call to the native dialer once a quote is accepted (§11)
- [ ] GraphQL — REST only (§5)
- [ ] ElasticSearch — Postgres full-text/`ILIKE` is enough for v1 (PRD-00 §1.2)

**Content / i18n (PRD-00 §3.3)**
- [ ] Real-time translation of free-text user content (RFQ descriptions, chat, supplier-typed titles) — shown as-typed; v2+. (UI strings + category names ARE localized en/hi.)

## B. Built but stubbed / simplified (flagged during the build)

These are wired with a clear seam but not production-complete:
- [ ] **FCM push** — notifications write a DB row + log an `[FCM stub]`; no real Firebase yet (no credentials). Affects lead/quote alerts + broadcast + the notification deep-link.
- [ ] **Email OTP delivery** — dev logs the code to the server console; no SES/SMTP wired.
- [ ] **Google sign-in** — backend `/auth/google` works; mobile button is stubbed (needs the native SDK + client ID); web Google not implemented.
- [ ] **Chat / messaging module (PRD-01 §11)** — schema + "buyer contact revealed once quoted" exist, but the chat endpoints/WebSocket and the quote-accept "chat unlock" are not built (it's a Support-tier module, not in the §6–10 Stage 2 scope).
- [ ] **Supplier self-onboarding** — creating a SupplierProfile (business name, GST) is done via seed/admin; suppliers can't self-register a profile in-app yet.
- [ ] **`users.preferred_locale` persistence** — locale is a client preference (mobile MMKV); there's no `preferred_locale` field in `PATCH /users/me`, so it isn't saved server-side.
- [ ] **Admin Help/Privacy/Terms content endpoint** — `content_pages` table + admin editor are not built; the mobile Content screen shows a placeholder.
- [ ] **Truck "Send as Requirement"** — opens Post Requirement; full cart→multiple-RFQs-grouped-by-category is simplified.
- [ ] **Multi-device refresh tokens** — one `refresh_token_hash` per user = one active session/device.

## C. Stage not yet built
- [ ] **Stage 5 — Next.js web app (PRD-03)**: `apps/web` is an empty placeholder. (Built order jumped 4 → 6; Stage 6 didn't depend on web.)

---
Stages completed: 0 (repo/DB), 1 (backend core), 2 (marketplace), 3 (thin admin),
4 (mobile), 6 (full admin). Pending: 5 (web).
