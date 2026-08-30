# Implementation Brief

## Layers

1. GitHub Pages SPA/PWA: UI, routing, local drafts/cache/outbox, install/update experience
2. Apps Script API: auth, validation, stock locking, idempotency, state transitions, durable jobs
3. Container-bound Google Sheet and Google Drive: durable records and files
4. Email via MailApp; Web Push is optional and not claimed in the initial release

## Primary routes

- `/` storefront and announcements
- `/product/:id` product detail
- `/favorites` favorites
- `/cart` ready-stock or Pre-order cart
- `/checkout` address and confirmation
- `/payment/:orderId` 20-minute payment proof
- `/orders` customer orders
- `/orders/:orderId` timeline, balance and messages
- `/profile` account, addresses, points and reviews
- `/admin` dashboard
- `/admin/products`, `/admin/preorders`, `/admin/orders`, `/admin/payments`, `/admin/content`, `/admin/customers`, `/admin/settings`

GitHub Pages uses hash routing in the first release so refresh and nested repository paths do not return 404.

The deployed Apps Script `/exec` URL is configured in `public/runtime-config.js` for this single-store repository. It is a routable endpoint, not an authorization secret; every protected action still requires a valid opaque session.

## Permission model

- Customer: own profile, favorites, carts, orders, payments, addresses and eligible reviews
- Admin: operational data and content; cannot change Owner role or security defaults
- Owner: all Admin abilities plus roles, security, global settings, audit and maintenance
- Every protected action validates an opaque session on Apps Script
- Destructive/security-sensitive actions require a recent privileged session

## API envelope

```json
{
  "ok": true,
  "data": {},
  "error": null,
  "requestId": "uuid",
  "serverTime": "ISO-8601",
  "apiVersion": "1.0.0"
}
```

POST requests use `text/plain` JSON to avoid browser preflight assumptions. Direct Apps Script transport remains provisional until deployed `/exec` GET/POST/redirect tests pass on target browsers.

## Critical checkout transaction

1. Validate session, product/campaign, quantity, per-user limit and open window
2. Acquire script lock and remove expired holds
3. Re-read authoritative available quantity
4. Create order, items, stock reservations, history and mutation record atomically within the lock
5. Return authoritative reference and `reservedUntil`
6. Uploading proof locks the order, validates expiry/ownership/amount, stores Drive file, converts holds to committed and records payment
7. Queue email/thumbnail after core rows commit

## File handling

- Product and announcement images: Admin uploads to a dedicated Drive folder
- Payment slips: client resizes/compresses; server validates MIME and size and writes to a private Drive folder
- FileRegistry stores ownership, Drive ID, MIME, size, checksum metadata and lifecycle state

## Notifications

- In-app notifications and email jobs for order creation, payment review, status change, balance request, delay/message and completion
- UI says email is queued until the job reports success

## Assumptions

- Currency THB and timezone Asia/Bangkok
- Email OTP is the default local sign-in; Google sign-in adapter is reserved for a later configuration
- Shipping starts as Admin-configurable flat rate; schema supports future shipping methods
- Manual slip review; no payment gateway in the first release
- Single deployment for one store, not a public multi-tenant service
