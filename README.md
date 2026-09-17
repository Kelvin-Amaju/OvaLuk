# OvaLuk Admin

OvaLuk is a single-administrator application monitoring dashboard with a React/Vinext frontend and a framework-free Core PHP + MySQL API.

## Included

- One admin account only; there is no public registration or non-admin user table.
- Token authentication, login throttling, secure password hashing, logout, optional TOTP MFA, and one-time recovery codes.
- CORS allowlist and preflight handling on every API route.
- Website CRUD, per-app hashed ingestion keys, maintenance status, key rotation, and an embeddable tracking script.
- Near-real-time dashboard polling every 5 seconds for visitors, identified users, page views, and custom events.
- Stripe, Paystack, and Flutterwave connections with encrypted credentials and signed webhook verification.
- Unified payments, engagement, alerts, and audit tables.
- Prepared PDO statements, JSON validation, payload limits, security headers, and no secrets in frontend responses.

## Requirements

- Node.js 22+ and pnpm/npm for the frontend
- PHP 8.1+ with PDO MySQL and OpenSSL
- MySQL 8+
- Apache `mod_rewrite`, or another server configured to route API requests to `backend/public/index.php`

## Install

1. Create the database and import `backend/database/schema.sql`.
2. Copy `backend/.env.example` to `backend/.env`. Set MySQL values, `APP_URL`, allowed CORS origins, and `APP_KEY`.
3. Generate the encryption key with `php -r "echo bin2hex(random_bytes(32));"`.
4. Point the PHP virtual host document root to `backend/public`.
5. Create the only admin with `php backend/bin/create-admin.php admin@example.com "Administrator"`.
6. Copy `.env.example` to `.env.local` and set `NEXT_PUBLIC_API_URL` to the PHP public URL.
7. Run `npm install`, then `npm run dev`. For production, run `npm run build` and deploy the frontend through a supported Node/Vinext host.

Open `backend/README.md` for tracker and payment webhook instructions.

## Important production settings

- Use HTTPS for both frontend and API.
- Set an exact comma-separated `CORS_ALLOWED_ORIGINS`; do not use `*`.
- Keep `.env` files outside version control and back up `APP_KEY`. Losing it makes encrypted payment credentials unreadable.
- Restrict the PHP document root to `backend/public`; never expose `config`, `src`, `database`, or `bin`.
- Run MySQL backups and a scheduled cleanup for expired sessions and old login attempts.

