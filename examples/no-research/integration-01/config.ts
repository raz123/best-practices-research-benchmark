import Stripe from "stripe";

export interface StripeConfig {
  secretKey: string;
  webhookSecret: string;
  apiVersion: Stripe.LatestApiVersion;
  maxNetworkRetries: number;
  timeout: number;
}

export function getStripeConfig(): StripeConfig {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!secretKey || typeof secretKey !== "string") {
    throw new Error("STRIPE_SECRET_KEY environment variable is required");
  }

  if (!webhookSecret || typeof webhookSecret !== "string") {
    throw new Error("STRIPE_WEBHOOK_SECRET environment variable is required");
  }

  return {
    secretKey,
    webhookSecret,
    apiVersion: "2024-12-18.acacia" as Stripe.LatestApiVersion,
    maxNetworkRetries: 3,
    timeout: 30_000,
  };
}

let stripeInstance: Stripe | null = null;

export function getStripeClient(): Stripe {
  if (!stripeInstance) {
    const config = getStripeConfig();
    stripeInstance = new Stripe(config.secretKey, {
      apiVersion: config.apiVersion,
      maxNetworkRetries: config.maxNetworkRetries,
      timeout: config.timeout,
    });
  }
  return stripeInstance;
}

export const WEBHOOK_EVENTS_TO_HANDLE = [
  "payment_intent.succeeded",
  "payment_intent.payment_failed",
  "payment_intent.canceled",
  "checkout.session.completed",
  "checkout.session.expired",
  "customer.subscription.created",
  "customer.subscription.updated",
  "customer.subscription.deleted",
  "invoice.payment_succeeded",
  "invoice.payment_failed",
  "invoice.finalized",
  "charge.refunded",
  "charge.dispute.created",
] as const;

export type WebhookEventType = (typeof WEBHOOK_EVENTS_TO_HANDLE)[number];

export const isWebhookEventType = (event: string): event is WebhookEventType =>
  (WEBHOOK_EVENTS_TO_HANDLE as readonly string[]).includes(event);
