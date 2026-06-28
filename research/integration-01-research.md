# Stripe Integration — Best Practices Research

## Task
Integrate Stripe payment processing with webhook handling for payment intents and subscriptions.

## Task Type: integration
## Date: 2026-06-28

---

## 1. Webhook Signature Verification (HMAC-SHA256)

**Core principle:** Always verify the raw request body bytes — never re-serialize parsed JSON.

- Extract `Stripe-Signature` header → parse `t=<timestamp>,v1=<signature>` pairs
- Compute `HMAC-SHA256(whsec_secret, "${t}.${rawBody}")` and compare to `v1`
- Use `crypto.timingSafeEqual()` for comparison — never `===` (prevents timing attacks)
- Enforce timestamp tolerance (default 300s / 5 minutes) to prevent replay attacks
- If using Express, mount `express.raw({ type: 'application/json' })` on the webhook route BEFORE any JSON parser
- Store recently seen event IDs (`Set<string>` with TTL) as secondary replay guard

**Source:** https://docs.stripe.com/webhooks/signatures

## 2. Idempotency Handling

- Generate deterministic idempotency keys per business operation (e.g., `order-${orderId}`)
- Stripe reuses keys for up to 24 hours — key maps 1:1 to one Stripe resource
- Pass idempotency key via Stripe request options: `{ idempotencyKey: "..." }`
- Never expose idempotency keys to the client for secret-key operations
- Store `event.id` in your database before processing — skip if already present (idempotent webhook handler)

## 3. Payment Intent Lifecycle

States: `requires_payment_method` → `requires_confirmation` → `requires_action` → `processing` → `succeeded` / `failed` / `canceled`

- Create server-side only, return `client_secret` to frontend for confirmation
- Use `automatic_payment_methods: { enabled: true }` for broad payment method support
- Handle `payment_intent.payment_failed` webhook to update order status
- Handle `payment_intent.succeeded` webhook to fulfill the order — never rely on client callback alone
- Store `payment_intent.id` on your order for reconciliation

## 4. Subscription Management

- Use webhooks as the source of truth for subscription state, not client-side polling
- Key events: `customer.subscription.created`, `updated`, `deleted`, `invoice.paid`, `invoice.payment_failed`
- Centralize subscription status in your DB: `active`, `past_due`, `canceled`, `trialing`
- Guard optional expanded fields (`latest_invoice`, `payment_intent`) with runtime checks before access
- Handle failed invoice payments: notify user, optionally retry via Stripe Smart Retries or manual retry

## 5. Error Handling Patterns

- Catch `StripeError` and branch on `error.type`:
  - `StripeCardError` → user-facing message (card declined, insufficient funds)
  - `StripeInvalidRequestError` → programming error, log and alert
  - `StripeAPIError` → Stripe-side issue, retry with backoff
  - `StripeConnectionError` → network issue, retry with exponential backoff
  - `StripeRateLimitError` → backoff and retry
- Map Stripe error codes to user-friendly messages for card errors
- Never expose raw Stripe error messages to end users
- Wrap webhook handlers in try/catch — always return 200 to Stripe (process async if needed)

## 6. Anti-Patterns to Avoid

- Re-serializing JSON body for signature verification (changes whitespace/encoding)
- Using `===` instead of `timingSafeEqual` for signature comparison
- Relying on client-side payment confirmation callback without webhook verification
- Not storing webhook event IDs for idempotent processing
- Accessing expanded Stripe objects without null checks
- Returning non-200 from webhook handler on processing errors (causes Stripe retries, may process twice)
- Exposing Stripe secret keys in client-side code or logs

## 7. Key Architecture Decisions

1. **Raw body capture:** Express `express.raw()` on webhook route, parse JSON only after verification
2. **Idempotency:** Two layers — Stripe idempotency keys for API calls, event ID dedup for webhooks
3. **State management:** Stripe is source of truth for billing; your DB mirrors subscription status
4. **Error isolation:** Webhook handlers return 200 immediately, queue heavy processing
5. **Secret rotation:** Support multiple `whsec_` secrets during rotation windows
