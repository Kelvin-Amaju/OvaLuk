# OvaLuk Core PHP API

Requirements: PHP 8.1+ with PDO MySQL and OpenSSL, MySQL 8+, and Apache `mod_rewrite` (or route all requests to `public/index.php`).

1. Create a MySQL database and import `database/schema.sql`.
2. Copy `.env.example` to `.env`, set the database credentials, allowed frontend origins, and a random `APP_KEY` (`php -r "echo bin2hex(random_bytes(32));"`).
3. Point the web server document root to `backend/public`.
4. Create the only admin: `php bin/create-admin.php admin@example.com "Admin Name"`.
5. Copy the frontend `.env.example` to `.env.local`, set `NEXT_PUBLIC_API_URL`, then build or run it.

When an application is added, OvaLuk returns its ingestion key once. Install the generated values in the tracked site:

```html
<script async src="https://analytics.example.com/tracker.js"
  data-api="https://analytics.example.com"
  data-key="ask_REPLACE_ME"></script>
```

Custom events: `window.OvaLuk.track('subscription_started', { plan: 'Pro' })`. Set `window.OvaLukUserId` after sign-in or call `window.OvaLuk.identify(userId)`.

Payment setup returns the webhook URL to add in Stripe, Paystack, or Flutterwave. Keep provider credentials out of the frontend; they are encrypted at rest with `APP_KEY`.

