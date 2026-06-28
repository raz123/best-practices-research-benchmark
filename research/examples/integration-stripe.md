# Stripe Payment Integration: Best Practices Research

## Stripe API Setup
- Use `stripe` npm package (official) — never raw HTTP to Stripe API
- Initialize with `new Stripe(process.env.STRIPE_SECRET_KEY)` — secret key only server-side
- Set `apiVersion` explicitly for API version pinning
- Use idempotency keys for non-GET requests to prevent duplicate charges

## Payment Intent Flow (Recommended)
- Create PaymentIntent server-side with `stripe.paymentIntents.create()`
- Return `client_secret` to frontend — never expose `secret_key`
- Frontend uses Stripe.js Elements for PCI compliance (card data never touches your server)
- Handle `payment_intent.succeeded`, `payment_intent.payment_failed` webhooks

## Webhook Handling
- Use `stripe.webhooks.constructEvent()` with raw body (NOT parsed JSON)
- Register webhook endpoint in Stripe Dashboard — use signing secret (`STRIPE_WEBHOOK_SECRET`)
- Return 200 quickly, process asynchronously — Stripe retries on non-2xx within 30s
- Handle idempotency: check `event.id` to prevent duplicate processing

## Subscription Management
- Create Price objects for recurring billing (not Plan objects — deprecated)
- Use `stripe.subscriptions.create()` with `payment_behavior: 'default_incomplete'`
- Handle `customer.subscription.updated`, `customer.subscription.deleted` events
- Implement proration for plan changes
- Store `stripeCustomerId` and `stripeSubscriptionId` in your database

## Error Handling
- Catch `StripeCardError` (declined), `StripeRateLimitError`, `StripeInvalidRequestError`
- Return user-friendly messages for card errors (don't expose Stripe error codes)
- Implement retry with exponential backoff for transient errors (429, 500)
- Log all Stripe errors with correlation IDs

## Anti-Patterns
- Do NOT store card details in your database — use Stripe tokens/payment methods
- Do NOT use client-side secret key — expose to all users
- Do NOT skip webhook signature verification — allows spoofed payments
- Do NOT assume payment succeeded based on client-side confirmation alone
- Do NOT hardcode prices — use Price objects from Stripe Dashboard

## Security Considerations
- Webhook endpoint must verify signature before processing
- Never log full card numbers or CVC (PCI DSS violation)
- Use Stripe Connect for marketplace payments (not manual transfers)
- Implement proper authentication before creating PaymentIntents
- Rate limit payment creation endpoints

## Testing
- Use Stripe test mode with test API keys
- Use `stripe listen` CLI for local webhook testing
- Test card numbers: 4242424242424242 (success), 4000000000000002 (declined)
- Test subscription lifecycle events in sandbox

## Source References
- Stripe docs: https://stripe.com/docs/payments
- Stripe webhook security: https://stripe.com/docs/webhooks/signatures
- PCI DSS compliance with Stripe Elements
