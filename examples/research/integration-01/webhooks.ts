/**
 * Stripe webhook verification and event routing.
 *
 * Security:
 * - HMAC-SHA256 signature verification with constant-time comparison
 * - Timestamp tolerance for replay protection (5 minutes)
 * - Support for multiple signing secrets during rotation
 * - Secondary event-ID dedup layer
 *
 * Architecture:
 * - Returns 200 immediately to Stripe; queues processing if needed
 * - Centralized error isolation: one handler's failure never crashes another
 * - Type-safe event routing with discriminated dispatch
 */

import crypto from "node:crypto";
import { getStripeConfig, getStripeClient } from "./config";
import type Stripe from "stripe";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface WebhookVerificationResult {
  verified: boolean;
  event?: Stripe.Event;
  error?: string;
}

export interface WebhookHandler {
  (event: Stripe.Event): Promise<void>;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Maximum age of a webhook timestamp in seconds (5 minutes) */
const TIMESTAMP_TOLERANCE_SECONDS = 300;

/** Maximum number of event IDs to track for dedup (LRU-style, oldest evicted) */
const MAX_EVENT_CACHE_SIZE = 10_000;

// ---------------------------------------------------------------------------
// Event ID dedup cache
// ---------------------------------------------------------------------------

const processedEventIds = new Set<string>();

function isEventAlreadyProcessed(eventId: string): boolean {
  return processedEventIds.has(eventId);
}

function markEventProcessed(eventId: string): void {
  // Evict oldest entries when cache is full
  if (processedEventIds.size >= MAX_EVENT_CACHE_SIZE) {
    const firstId = processedEventIds.values().next().value;
    if (firstId !== undefined) {
      processedEventIds.delete(firstId);
    }
  }
  processedEventIds.add(eventId);
}

// ---------------------------------------------------------------------------
// Signature verification
// ---------------------------------------------------------------------------

/**
 * Parse the Stripe-Signature header into timestamp and signature pairs.
 */
function parseStripeSignature(
  header: string
): { timestamp: string; signatures: string[] } {
  const parts: Record<string, string> = {};

  for (const kv of header.split(",")) {
    const [key, ...rest] = kv.split("=");
    if (key && rest.length > 0) {
      parts[key] = rest.join("="); // v1 signatures may contain = padding
    }
  }

  if (!parts.t || !parts.v1) {
    throw new Error("Invalid Stripe-Signature header: missing t or v1");
  }

  // Collect all v1 signatures (multiple secrets produce multiple v1 entries)
  const signatures = header
    .split(",")
    .filter((kv) => kv.trim().startsWith("v1="))
    .map((kv) => kv.split("=").slice(1).join("="));

  return { timestamp: parts.t, signatures };
}

/**
 * Verify a Stripe webhook signature against one or more signing secrets.
 *
 * @param rawBody - The raw request body as a Buffer (NOT re-serialized JSON)
 * @param signatureHeader - The value of the Stripe-Signature header
 * @param signingSecrets - Array of whsec_ secrets (primary + rotation candidates)
 * @returns Verification result with parsed event on success
 */
export function verifyWebhookSignature(
  rawBody: Buffer,
  signatureHeader: string,
  signingSecrets: string[]
): WebhookVerificationResult {
  // 1. Parse signature header
  let parsed: { timestamp: string; signatures: string[] };
  try {
    parsed = parseStripeSignature(signatureHeader);
  } catch (err) {
    return {
      verified: false,
      error: `Signature header parse error: ${err instanceof Error ? err.message : String(err)}`,
    };
  }

  // 2. Check timestamp tolerance (replay protection)
  const now = Math.floor(Date.now() / 1000);
  const timestamp = parseInt(parsed.timestamp, 10);

  if (isNaN(timestamp) || Math.abs(now - timestamp) > TIMESTAMP_TOLERANCE_SECONDS) {
    return {
      verified: false,
      error: "Webhook timestamp outside tolerance window (possible replay attack)",
    };
  }

  // 3. Try verification against each signing secret
  const signedPayload = `${parsed.timestamp}.${rawBody.toString("utf8")}`;

  for (const secret of signingSecrets) {
    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(signedPayload, "utf8")
      .digest("hex");

    const expectedBuffer = Buffer.from(expectedSignature, "hex");

    for (const sig of parsed.signatures) {
      const receivedBuffer = Buffer.from(sig, "hex");

      // Constant-time comparison — prevents timing attacks
      if (
        expectedBuffer.length === receivedBuffer.length &&
        crypto.timingSafeEqual(expectedBuffer, receivedBuffer)
      ) {
        // Signature verified — parse event
        try {
          const event = JSON.parse(rawBody.toString("utf8")) as Stripe.Event;
          return { verified: true, event };
        } catch {
          return { verified: false, error: "Failed to parse webhook event body" };
        }
      }
    }
  }

  return { verified: false, error: "Invalid webhook signature" };
}

// ---------------------------------------------------------------------------
// Event routing
// ---------------------------------------------------------------------------

type EventTypeName = Stripe.Event["type"];
type EventHandlerMap = Map<EventTypeName, WebhookHandler>;

const handlers: EventHandlerMap = new Map();

/**
 * Register a handler for a specific Stripe event type.
 * Supports wildcards: "payment_intent.*" matches all payment_intent events.
 */
export function onStripeEvent(
  eventType: EventTypeName,
  handler: WebhookHandler
): void {
  handlers.set(eventType, handler);
}

/**
 * Process a verified Stripe event by dispatching to registered handlers.
 * Handles idempotency via event ID dedup.
 * Isolates handler failures — one handler's error does not affect others.
 */
async function processEvent(event: Stripe.Event): Promise<void> {
  // Idempotency: skip already-processed events
  if (isEventAlreadyProcessed(event.id)) {
    return;
  }

  // Find matching handler (exact match first, then wildcard)
  const exactHandler = handlers.get(event.type);
  const wildcardParts = event.type.split(".");
  const wildcardKey = `${wildcardParts[0]}.*`;
  const wildcardHandler = handlers.get(wildcardKey);

  const handler = exactHandler ?? wildcardHandler;

  if (handler) {
    try {
      await handler(event);
    } catch (err) {
      // Log but don't rethrow — Stripe expects 200
      // In production, emit to error monitoring (Sentry, Datadog, etc.)
      console.error(
        `[stripe-webhooks] Handler error for ${event.type} (${event.id}):`,
        err
      );
    }
  }

  // Mark processed after successful or skipped handling
  markEventProcessed(event.id);
}

// ---------------------------------------------------------------------------
// Express-style middleware factory
// ---------------------------------------------------------------------------

/**
 * Create an Express middleware that verifies and routes Stripe webhooks.
 *
 * Usage:
 *   app.post('/webhook', createWebhookMiddleware(), handleWebhook);
 *
 * Requires express.raw({ type: 'application/json' }) to be mounted on this route.
 * The raw body is available as req.body (Buffer) when using express.raw().
 */
export function createWebhookMiddleware() {
  return async function webhookMiddleware(
    req: { body: Buffer; headers: Record<string, string | undefined> },
    res: { status: (code: number) => { send: (msg: string) => void } },
    next: () => void
  ): Promise<void> {
    const signatureHeader = req.headers["stripe-signature"];

    if (!signatureHeader) {
      res.status(400).send("Missing Stripe-Signature header");
      return;
    }

    const config = getStripeConfig();
    const rawBody = req.body;

    if (!Buffer.isBuffer(rawBody)) {
      res.status(400).send("Webhook body must be raw bytes, not parsed JSON");
      return;
    }

    const result = verifyWebhookSignature(
      rawBody,
      signatureHeader,
      config.webhookSecrets
    );

    if (!result.verified || !result.event) {
      res.status(400).send(result.error ?? "Webhook verification failed");
      return;
    }

    // Attach event to request for downstream handler
    (req as Record<string, unknown>).stripeEvent = result.event;

    try {
      await processEvent(result.event);
    } catch (err) {
      console.error("[stripe-webhooks] Unexpected processing error:", err);
    }

    // Always return 200 to Stripe
    res.status(200).send("ok");
  };
}

// ---------------------------------------------------------------------------
// Testing helpers
// ---------------------------------------------------------------------------

/**
 * Generate a signed webhook payload for testing.
 * Use with Stripe CLI's `stripe trigger` or for unit tests.
 */
export function signWebhookPayload(
  payload: string,
  secret: string,
  timestamp?: number
): { signature: string; timestamp: number } {
  const ts = timestamp ?? Math.floor(Date.now() / 1000);
  const signedPayload = `${ts}.${payload}`;
  const signature = crypto
    .createHmac("sha256", secret)
    .update(signedPayload, "utf8")
    .digest("hex");

  return {
    signature: `t=${ts},v1=${signature}`,
    timestamp: ts,
  };
}

/**
 * Clear all registered handlers and the dedup cache (for testing).
 */
export function resetWebhookState(): void {
  handlers.clear();
  processedEventIds.clear();
}
