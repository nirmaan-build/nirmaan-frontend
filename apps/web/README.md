# Nirmaan Web (Next.js, mobile-first)

Same product + backend as the mobile app, as a responsive web app (PRD-03). The
SEO / no-install entry point. App Router.

## Stack
- Next.js App Router; React Query (client data) + cookie-based auth (SSR-readable)
- Shared i18n from `@nirmaan/shared` (same `en.json`/`hi.json` + `translate` as mobile)
- One nav config (`lib/nav.ts`) rendered as a top header (≥768px) and a bottom tab bar (<768px)

## Rendering strategy (PRD-03 §5)
- **SSR** (server components): `/` Home, `/categories`, `/categories/[slug]` — SEO-critical
- **CSR** behind auth: `/truck`, `/profile`, `/rfq/new`, `/rfq/[id]`, `/login`, `/onboarding`
- **Static**: `/help`, `/privacy`, `/terms`

## Run

Backend must be running (`apps/backend`, :3000).

```bash
cd apps/web
cp .env.local.example .env.local      # NEXT_PUBLIC_API_URL=http://localhost:3000/api/v1
npm install
npm run dev                            # http://localhost:3002
```

## Notes / flags
- Tokens are stored in cookies (so SSR can read them); non-httpOnly for MVP.
- `@nirmaan/shared` is consumed via a tsconfig path alias + `experimental.externalDir`
  (no workspace tooling). If you adopt npm/yarn workspaces later, switch to
  `transpilePackages: ['@nirmaan/shared']`.
- No item-detail route (PRD-03 §4.1); catalog items live on the category page, and
  item search-suggestions route to the categories browse page.
- Google sign-in is not implemented on web (email OTP only); content pages are placeholders.
