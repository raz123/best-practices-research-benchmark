import crypto from "crypto";
import Stripe from "stripe";
import { getStripeConfig, isWebhookEventType, type WebhookEventType } from "./config";

export interface WebhookVerificationResult {
  verified: boolean;
  event?: Stripe.Event;
  error?: string;
}

export function verifyWebhookSignature(
  payload: string | Buffer,
  signatureHeader: string | undefined,
): WebhookVerificationResult {
  if (!signatureHeader) {
    return { verified: false, error: "Missing Stripe-Signature header" };
  }

  const config = getStripeConfig();

  const elements = signatureHeader.split(",");
  const signatureMap: Record<string, string> = {};

  for (const element of elements) {
    const [key, value] = element.split("=");
    if (key && value) {
      signatureMap[key] = value;
    }
  }

  const timestamp = signatureMap["t"];
  const signature = signatureMap["v1"];

  if (!timestamp || !signature) {
    return { verified: false, error: "Invalid signature format" };
  }

  const tolerance = 300; // 5 minutes
  const timestampInt = parseInt(timestamp, 10);
  const currentTime = Math.floor(Date.now() / 1000);

  if (Math.abs(currentTime - timestampInt) > tolerance) {
    return { verified: false, error: "Timestamp outside tolerance window" };
  }

  const signedPayload = `${timestamp}.${payload}`;
  const expectedSignature = crypto
    .createHmac("sha256", config.webhookSecret)
    .update(signedPayload, "utf-8")
    .digest("hex");

  const signaturesMatch = crypto.timingSafeEqual(
    Buffer.from(signature, "utf-8"),
    Buffer.from(expectedSignature, "utf-8"),
  );

  if (!signaturesMatch) {
    return { verified: false, error: "Signature mismatch" };
  }

  try {
    const event = JSON.parse(payload.toString()) as Stripe.Event;

    if (!event.id || !event.type || !event.data) {
      return { verified: false, error: "Invalid event structure" };
    }

    return { verified: true, event };
  } catch {
    return { verified: false, error: "Failed to parse event payload" };
  }
}

export interface WebhookEventRecord {
  id: string;
  type: WebhookEventType;
  processedAt: Date;
  data: Record<string, unknown>;
}

const processedEvents = new Map<string, WebhookEventRecord>();

export function isEventProcessed(eventId: string): boolean {
  return processedEvents.has(eventId);
}

export function markEventProcessed(event: Stripe.Event): void {
  if (!isWebhookEventType(event.type)) {
    throw new Error(`Unknown event type: ${event.type}`);
  }

  processedEvents.set(event.id, {
    id: event.id,
    type: event.type,
    processedAt: new Date(),
    data: event.data.object as Record<string, unknown>,
  });
}

export function cleanupProcessedEvents(maxAgeMs: number = 24 * 60 * 60 * 1000): number {
  const cutoff = new Date(Date.now() - maxAgeMs);
  let removed = 0;

  for (const [id, record] of processedEvents) {
    if (record.processedAt < cutoff) {
      processedEvents.delete(id);
      removed++;
    }
  }

  return removed;
}

export type WebhookHandler = (event: Stripe.Event) => Promise<void>;

const handlers = new Map<WebhookEventType, WebhookHandler>();

export function registerWebhookHandler(
  eventType: WebhookEventType,
  handler: WebhookHandler,
): void {
  handlers.set(eventType, handler);
}

export function getWebhookHandler(eventType: WebhookEventType): WebhookHandler | undefined {
  return handlers.get(eventType);
}

export interface ProcessWebhookResult {
  success: boolean;
  eventType: string;
  eventId: string;
  error?: string;
}

export async function processWebhook(
  payload: string | Buffer,
  signatureHeader: string | undefined,
): Promise<ProcessWebhookResult> {
  const verification = verifyWebhookSignature(payload, signatureHeader);

  if (!verification.verified || !verification.event) {
    return {
      success: false,
      eventType: "unknown",
      eventId: "unknown",
      error: verification.error,
    };
  }

  const event = verification.event;

  if (isEventProcessed(event.id)) {
    return {
      success: true,
      eventType: event.type,
      eventId: event.id,
    };
  }

  const handler = getWebhookHandler(event.type as WebhookEventType);
  if (!handler) {
    return {
      success: false,
      eventType: event.type,
      eventId: event.id,
      error: `No handler registered for event type: ${event.type}`,
    };
  }

  try {
    await handler(event);
    markEventProcessed(event);
    return {
      success: true,
      eventType: event.type,
      eventId: event.id,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return {
      success: false,
      eventType: event.type,
      eventId: event.id,
      error: `Handler failed: ${errorMessage}`,
    };
  }
}
