# Nirmaan Admin (thin)

Next.js (App Router) admin panel. **Stage 3 scope only:** Categories CRUD (with
English + Hindi names) and Serviceable Areas add/activate. Supplier verification,
catalog moderation, and notification broadcast come in Stage 6 (PRD-04).

Auth is the email-allowlist admin login from PRD-04 §5 (separate from the public
user OTP flow).

## Run

The backend must be running first (`apps/backend`, port 3000).

```bash
cd apps/admin
cp .env.local.example .env.local      # NEXT_PUBLIC_API_URL=http://localhost:3000/api/v1
npm install
npm run dev                            # http://localhost:3001
```

Sign in with an email from the backend's `ADMIN_EMAILS` allowlist and the
`ADMIN_PASSWORD` value (both in `apps/backend/.env`).

## Pages

- `/login` — admin sign in (email + password).
- `/categories` — list, add (EN + HI name + sort order), edit, delete.
- `/areas` — list, add a pincode (starts inactive), activate / deactivate.

The admin token is kept in `localStorage`; on a 401 the UI bounces back to `/login`.
