# Nirmaan — Postman

Importable API collection, kept in sync with the backend (`apps/backend`).

## Files

- `Nirmaan.postman_collection.json` — all endpoints, grouped by module. Collection variables ship with it as fallback defaults.
- `Nirmaan.dev.postman_environment.json` — **required**: the test scripts write tokens and IDs into the active *environment*, so import this and select it. (Duplicate it for staging/prod by changing `baseUrl`.)

## Import (single click)

In Postman: **Import → File →** select **both** `Nirmaan.postman_collection.json` and `Nirmaan.dev.postman_environment.json`, then select the **"Nirmaan - Local Dev"** environment top-right. The environment must be selected or the auto-saved tokens won't take effect.

## Auto-saved tokens (no copy/paste)

The collection uses collection-level **Bearer `{{accessToken}}`** auth, and request test scripts capture tokens automatically:

| Request | Saves |
|---|---|
| Auth / Verify OTP | `accessToken`, `refreshToken`, `userId` |
| Auth / Google Login | `accessToken`, `refreshToken`, `userId` |
| Auth / Refresh Access Token | `accessToken` |
| Auth / Logout | clears `accessToken`, `refreshToken` |

So after **Verify OTP**, every protected request (Get Me, Switch Area, Active Areas, …) just works.

## Quick flow

1. **Auth / Request OTP** — then read the 6-digit code from the backend server log (email delivery isn't wired yet).
2. Set the `otpCode` environment variable to that code.
3. **Auth / Verify OTP** — tokens saved automatically.
4. **Users / Update Me (Onboarding)** — sets name + pincode, flips `profileComplete`.
5. Explore the rest.

## Keeping it in sync

This collection is updated whenever the API changes (new endpoints, contract changes). It currently covers **Stage 1** (Auth, Users, Areas), **Stage 2** (Catalog, RFQ, Leads, Quotes, Cart), and **Stage 3** (Admin). Test scripts also auto-save `categoryId`, `catalogItemId`, `rfqId`, `leadId`, `quoteId`, `cartItemId`, and `adminToken` as you go.

The **Admin** folder uses a separate `{{adminToken}}` (run *Admin Login* first) — it's distinct from the public-user `accessToken`.

For supplier-side requests (Leads, Submit Quote, Supplier catalog) you need a supplier token: re-run **Auth / Verify OTP** with `otpEmail = supplier@example.com` to swap `accessToken`, then switch back to the buyer for accept/reject. See `apps/backend/TESTING-stage2.md`.
