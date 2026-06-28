# Sample: What the Skill Adds to the Agent Prompt

This file shows the **actual prompt injection** that the `best-practices-research` skill adds to the implementation agent's instructions. This is what the agent sees when research is enabled.

---

## Before (No Research)

The implementation agent receives only the original task description:

```
Implement a Stripe payment processing integration with webhook handling
for payment intents and subscriptions.

Tech: Stripe API, webhooks, Node.js
```

**Agent output**: The agent writes code from training data — may miss current API patterns,
webhook verification, idempotency, or security best practices.

---

## After (With Research)

The implementation agent receives the original task **plus** a research reference:

```
Implement a Stripe payment processing integration with webhook handling
for payment intents and subscriptions.

Tech: Stripe API, webhooks, Node.js

BEST PRACTICES: Read .planning/best-practices/integration-stripe-20260628.md
before implementing. Follow the patterns and avoid the anti-patterns
documented there.
```

The agent then reads the research file, which contains:

```markdown
# Stripe Webhook Integration — Best Practices

## 1. Signature Verification (Non-Negotiable)
- Always verify `Stripe-Signature` header using HMAC-SHA256
- Use the **raw request body** (Buffer), never `req.body` parsed by middleware
- Use `stripe.webhooks.constructEvent(rawBody, sig, secret)`

## 2. Idempotency Architecture (Two-Layer)
- Fast path: Redis key `webhook:seen:{eventId}` with TTL
- Durable path: DB table `webhook_events(event_id PRIMARY KEY, ...)`
- Mark processed **only after successful handler completion**

## 3. Queue-Based Processing (Don't Block the Webhook)
- Return 200 immediately after enqueueing
- Dedicated queue for webhook jobs
- Dead-letter queue for events failing after all retries

## 4. Event Type Routing
| Event | Action |
|---|---|
| `payment_intent.succeeded` | Confirm order, provision access |
| `payment_intent.payment_failed` | Notify user, flag account |
| `invoice.payment_succeeded` | Renew subscription access |
| ... | ... |

## 5. Security Hardening
- HTTPS-only endpoint
- Store `STRIPE_WEBHOOK_SECRET` in env/secrets manager
- Rotate webhook secret on suspected compromise

## Common Pitfalls
| Pitfall | Impact |
|---|---|
| Parsing body before verification | Signature mismatch |
| No idempotency check | Double charges on retries |
| Blocking webhook handler | Unnecessary retries |
```

**Agent output**: The agent writes code that follows all these patterns — signature
verification, idempotency, queue-based processing, proper event routing, and security
hardening. The quality difference is measurable: +0.92 points on our 5-point scale
for this specific task.

---

## Prompt Injection Mechanism

The skill works by modifying the `assignment` field of the `task()` call:

```javascript
// Without research (raw delegation)
task(
  agent: "task",
  id: "Impl-stripe-webhooks",
  role: "Implementation: integration",
  assignment: "Implement Stripe payment processing with webhook handling..."
)

// With research (skill-injected)
task(
  agent: "task",
  id: "Impl-stripe-webhooks",
  role: "Implementation: integration",
  assignment: `
    Implement Stripe payment processing with webhook handling...

    BEST PRACTICES: Read .planning/best-practices/integration-stripe-20260628.md
    before implementing. Follow the patterns and avoid the anti-patterns
    documented there.
  `
)
```

The key difference is the **two-line instruction** that tells the agent to read the
research file before implementing. The research file was produced by a separate
subagent that spent ~21 seconds gathering current best practices for this specific
task domain.

---

## Research Output Examples

See `research/examples/` for real research files produced during our benchmark:

- `integration-stripe.md` — Stripe webhook patterns, idempotency, security
- `feature-wasm-image.md` — WASM memory management, SIMD, Canvas API
- `fixer-websocket.md` — Connection cleanup, heartbeat patterns, graceful shutdown

Each file is 50-80 lines of concise, actionable guidance — not a tutorial, but a
**checklist of what to do and what to avoid** for that specific domain.
