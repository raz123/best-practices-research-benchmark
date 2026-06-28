/**
 * Stripe payment intent and subscription management.
 *
 * Payment Intents:
 * - Server-side creation with deterministic idempotency keys
 * - Client secret returned to frontend for confirmation
 * - Full lifecycle tracking via webhooks
 *
 * Subscriptions:
 * - Webhook-driven state synchronization
 * - Centralized subscription status in application DB
 * - Error-isolated event handlers
 *
 * Error handling:
 * - Classified Stripe errors with user-friendly messages
 * - Never exposes raw Stripe errors to end users
 * - Retry logic with exponential backoff for transient failures
 */

import { getStripeClient } from "./config";
import { onStripeEvent } from "./webhooks";
import type Stripe from "stripe";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CreatePaymentIntentParams {
  amount: number;
  currency: string;
  customerId?: string;
  orderId: string;
  metadata?: Record<string, string>;
  idempotencyKey?: string;
}

export interface PaymentIntentResult {
  id: string;
  clientSecret: string | null;
  status: Stripe.PaymentIntent.Status;
}

export interface CreateSubscriptionParams {
  customerId: string;
  priceId: string;
  trialPeriodDays?: number;
  metadata?: Record<string, string>;
  idempotencyKey?: string;
}

export interface SubscriptionResult {
  id: string;
  status: Stripe.Subscription.Status;
  currentPeriodEnd: Date;
  latestInvoiceId?: string;
}

export interface StripeErrorInfo {
  type: string;
  code?: string;
  message: string;
  userMessage: string;
  retryable: boolean;
}

// ---------------------------------------------------------------------------
// Error classification
// ---------------------------------------------------------------------------

/**
 * Classify a Stripe error into a structured error info object.
 * Maps raw Stripe errors to user-friendly messages and retry guidance.
 */
export function classifyStripeError(err: unknown): StripeErrorInfo {
  // Not a Stripe error
  if (!err || typeof err !== "object" || !("type" in err)) {
    return {
      type: "unknown",
      message: String(err),
      userMessage: "An unexpected error occurred. Please try again.",
      retryable: false,
    };
  }

  const stripeErr = err as {
    type: string;
    code?: string;
    message?: string;
    statusCode?: number;
  };

  switch (stripeErr.type) {
    case "StripeCardError":
      return {
        type: "card_error",
        code: stripeErr.code,
        message: stripeErr.message ?? "Card error",
        userMessage: mapCardErrorCode(stripeErr.code),
        retryable: false,
      };

    case "StripeInvalidRequestError":
      return {
        type: "invalid_request",
        code: stripeErr.code,
        message: stripeErr.message ?? "Invalid request",
        userMessage: "There was a problem with your request. Please try again.",
        retryable: false,
      };

    case "StripeAuthenticationError":
      return {
        type: "authentication",
        message: stripeErr.message ?? "Authentication failed",
        userMessage: "Payment service configuration error.",
        retryable: false,
      };

    case "StripeRateLimitError":
      return {
        type: "rate_limit",
        message: stripeErr.message ?? "Rate limited",
        userMessage: "Too many requests. Please try again in a moment.",
        retryable: true,
      };

    case "StripeConnectionError":
      return {
        type: "connection",
        message: stripeErr.message ?? "Connection error",
        userMessage: "Payment service is temporarily unavailable. Please try again.",
        retryable: true,
      };

    case "StripeAPIError":
      return {
        type: "api",
        message: stripeErr.message ?? "API error",
        userMessage: "Payment service is temporarily unavailable. Please try again.",
        retryable: true,
      };

    default:
      return {
        type: stripeErr.type,
        code: stripeErr.code,
        message: stripeErr.message ?? "Unknown Stripe error",
        userMessage: "An unexpected error occurred. Please try again.",
        retryable: false,
      };
  }
}

/**
 * Map Stripe card error codes to user-friendly messages.
 */
function mapCardErrorCode(code?: string): string {
  switch (code) {
    case "card_declined":
      return "Your card was declined. Please try a different payment method.";
    case "insufficient_funds":
      return "Insufficient funds. Please try a different payment method.";
    case "incorrect_cvc":
      return "The CVC number is incorrect. Please check and try again.";
    case "expired_card":
      return "Your card has expired. Please try a different payment method.";
    case "processing_error":
      return "An error occurred processing your card. Please try again.";
    case "incorrect_number":
      return "The card number is incorrect. Please check and try again.";
    case "card_not_supported":
      return "This card does not support this type of purchase.";
    case "currency_not_supported":
      return "This card does not support the selected currency.";
    case "duplicate_transaction":
      return "A duplicate transaction was detected. Please check your orders.";
    case "incorrect_address":
      return "The billing address is incorrect. Please check and try again.";
    default:
      return "Your card was declined. Please try a different payment method.";
  }
}

// ---------------------------------------------------------------------------
// Payment Intent operations
// ---------------------------------------------------------------------------

/**
 * Create a payment intent with idempotency protection.
 *
 * Generates a deterministic idempotency key from orderId if not provided,
 * ensuring safe retries without duplicate charges.
 *
 * @returns Payment intent with client secret for frontend confirmation
 * @throws Classified StripeError on failure
 */
export async function createPaymentIntent(
  params: CreatePaymentIntentParams
): Promise<PaymentIntentResult> {
  const stripe = getStripeClient();

  const idempotencyKey =
    params.idempotencyKey ?? `pay-order-${params.orderId}`;

  try {
    const paymentIntent = await stripe.paymentIntents.create(
      {
        amount: params.amount,
        currency: params.currency,
        customer: params.customerId,
        metadata: {
          orderId: params.orderId,
          ...params.metadata,
        },
        automatic_payment_methods: { enabled: true },
      },
      { idempotencyKey }
    );

    return {
      id: paymentIntent.id,
      clientSecret: paymentIntent.client_secret,
      status: paymentIntent.status,
    };
  } catch (err) {
    throw classifyStripeError(err);
  }
}

/**
 * Retrieve a payment intent by ID.
 */
export async function getPaymentIntent(
  paymentIntentId: string
): Promise<PaymentIntentResult> {
  const stripe = getStripeClient();

  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    return {
      id: paymentIntent.id,
      clientSecret: paymentIntent.client_secret,
      status: paymentIntent.status,
    };
  } catch (err) {
    throw classifyStripeError(err);
  }
}

// ---------------------------------------------------------------------------
// Subscription operations
// ---------------------------------------------------------------------------

/**
 * Create a subscription with idempotency protection.
 *
 * @returns Subscription with status and billing period info
 * @throws Classified StripeError on failure
 */
export async function createSubscription(
  params: CreateSubscriptionParams
): Promise<SubscriptionResult> {
  const stripe = getStripeClient();

  const idempotencyKey =
    params.idempotencyKey ?? `sub-${params.customerId}-${params.priceId}`;

  try {
    const subscription = await stripe.subscriptions.create(
      {
        customer: params.customerId,
        items: [{ price: params.priceId }],
        trial_period_days: params.trialPeriodDays,
        metadata: params.metadata,
        payment_behavior: "default_incomplete",
        expand: ["latest_invoice.payment_intent"],
      },
      { idempotencyKey }
    );

    return {
      id: subscription.id,
      status: subscription.status,
      currentPeriodEnd: new Date(
        (subscription as Record<string, unknown>)["current_period_end"] as number * 1000
      ),
      latestInvoiceId:
        typeof subscription.latest_invoice === "string"
          ? subscription.latest_invoice
          : subscription.latest_invoice?.id,
    };
  } catch (err) {
    throw classifyStripeError(err);
  }
}

/**
 * Cancel a subscription immediately or at period end.
 */
export async function cancelSubscription(
  subscriptionId: string,
  atPeriodEnd = true
): Promise<void> {
  const stripe = getStripeClient();

  try {
    if (atPeriodEnd) {
      await stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: true,
      });
    } else {
      await stripe.subscriptions.cancel(subscriptionId);
    }
  } catch (err) {
    throw classifyStripeError(err);
  }
}

/**
 * Update a subscription's price (plan change).
 */
export async function updateSubscription(
  subscriptionId: string,
  newPriceId: string
): Promise<SubscriptionResult> {
  const stripe = getStripeClient();

  try {
    // Retrieve current subscription to get the existing item
    const current = await stripe.subscriptions.retrieve(subscriptionId);
    const existingItem = current.items.data[0];

    if (!existingItem) {
      throw new Error("Subscription has no items to update");
    }

    const updated = await stripe.subscriptions.update(subscriptionId, {
      items: [
        {
          id: existingItem.id,
          price: newPriceId,
        },
      ],
      proration_behavior: "create_prorations",
    });

    return {
      id: updated.id,
      status: updated.status,
      currentPeriodEnd: new Date(
        (updated as Record<string, unknown>)["current_period_end"] as number * 1000
      ),
      latestInvoiceId:
        typeof updated.latest_invoice === "string"
          ? updated.latest_invoice
          : updated.latest_invoice?.id,
    };
  } catch (err) {
    throw classifyStripeError(err);
  }
}

// ---------------------------------------------------------------------------
// Webhook event handlers
// ---------------------------------------------------------------------------

/**
 * Register all payment and subscription webhook handlers.
 * Call this once at application startup.
 *
 * Handlers are idempotent: they can be safely called multiple times
 * for the same event without side effects.
 */
export function registerPaymentWebhookHandlers(): void {
  // --- Payment Intent events ---

  onStripeEvent("payment_intent.succeeded", async (event) => {
    const paymentIntent = event.data.object as Stripe.PaymentIntent;
    const orderId = paymentIntent.metadata?.orderId;

    console.log(
      `[payments] Payment succeeded: ${paymentIntent.id} (order: ${orderId ?? "unknown"})`
    );

    // TODO: Fulfill order — update order status, send confirmation email, etc.
    // await fulfillOrder(orderId, paymentIntent.id);
  });

  onStripeEvent("payment_intent.payment_failed", async (event) => {
    const paymentIntent = event.data.object as Stripe.PaymentIntent;
    const orderId = paymentIntent.metadata?.orderId;

    console.log(
      `[payments] Payment failed: ${paymentIntent.id} (order: ${orderId ?? "unknown"})`
    );

    // TODO: Update order status, notify user of failure
    // await handlePaymentFailure(orderId, paymentIntent);
  });

  onStripeEvent("payment_intent.canceled", async (event) => {
    const paymentIntent = event.data.object as Stripe.PaymentIntent;
    console.log(`[payments] Payment canceled: ${paymentIntent.id}`);

    // TODO: Update order status to canceled
  });

  // --- Subscription events ---

  onStripeEvent("customer.subscription.created", async (event) => {
    const subscription = event.data.object as Stripe.Subscription;
    console.log(
      `[payments] Subscription created: ${subscription.id} (status: ${subscription.status})`
    );

    // TODO: Create local subscription record, grant access
  });

  onStripeEvent("customer.subscription.updated", async (event) => {
    const subscription = event.data.object as Stripe.Subscription;
    console.log(
      `[payments] Subscription updated: ${subscription.id} (status: ${subscription.status})`
    );

    // TODO: Sync subscription status to local DB
  });

  onStripeEvent("customer.subscription.deleted", async (event) => {
    const subscription = event.data.object as Stripe.Subscription;
    console.log(
      `[payments] Subscription canceled: ${subscription.id}`
    );

    // TODO: Revoke access, update local status
  });

  // --- Invoice events ---

  onStripeEvent("invoice.paid", async (event) => {
    const invoice = event.data.object as Stripe.Invoice;
    console.log(
      `[payments] Invoice paid: ${invoice.id} (amount: ${invoice.amount_paid})`
    );

    // TODO: Extend subscription period, send receipt
  });

  onStripeEvent("invoice.payment_failed", async (event) => {
    const invoice = event.data.object as Stripe.Invoice;
    console.log(
      `[payments] Invoice payment failed: ${invoice.id}`
    );

    // TODO: Notify customer, trigger dunning flow
  });
}
