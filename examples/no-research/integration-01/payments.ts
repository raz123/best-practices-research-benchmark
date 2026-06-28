import crypto from "crypto";
import Stripe from "stripe";
import { getStripeClient } from "./config";

export interface IdempotencyKeyConfig {
  key: string;
  ttlMs?: number;
}

const idempotencyStore = new Map<string, { result: unknown; expiresAt: number }>();

function getIdempotencyOptions(
  idempotencyKey?: string,
): Stripe.RequestOptions | undefined {
  if (!idempotencyKey) return undefined;

  return {
    idempotencyKey,
  };
}

export function generateIdempotencyKey(prefix: string, identifier: string): string {
  const timestamp = Date.now();
  const random = crypto.randomUUID().slice(0, 8);
  return `${prefix}_${identifier}_${timestamp}_${random}`;
}

function isIdempotentResult(key: string): boolean {
  const entry = idempotencyStore.get(key);
  if (!entry) return false;

  if (Date.now() > entry.expiresAt) {
    idempotencyStore.delete(key);
    return false;
  }

  return true;
}

function storeIdempotentResult(key: string, result: unknown, ttlMs: number): void {
  idempotencyStore.set(key, {
    result,
    expiresAt: Date.now() + ttlMs,
  });
}

export interface CreatePaymentIntentParams {
  amount: number;
  currency: string;
  customerId?: string;
  paymentMethodId?: string;
  description?: string;
  metadata?: Record<string, string>;
  automaticPaymentMethods?: boolean;
  confirm?: boolean;
  returnUrl?: string;
  idempotencyKey?: string;
}

export interface PaymentIntentResult {
  success: boolean;
  paymentIntent?: Stripe.PaymentIntent;
  clientSecret?: string;
  error?: string;
}

export async function createPaymentIntent(
  params: CreatePaymentIntentParams,
): Promise<PaymentIntentResult> {
  const stripe = getStripeClient();

  if (params.idempotencyKey && isIdempotentResult(params.idempotencyKey)) {
    const cached = idempotencyStore.get(params.idempotencyKey);
    if (cached) {
      return cached.result as PaymentIntentResult;
    }
  }

  try {
    const paymentIntent = await stripe.paymentIntents.create(
      {
        amount: params.amount,
        currency: params.currency,
        customer: params.customerId,
        payment_method: params.paymentMethodId,
        description: params.description,
        metadata: params.metadata,
        automatic_payment_methods: params.automaticPaymentMethods
          ? { enabled: true }
          : undefined,
        confirm: params.confirm ?? false,
        return_url: params.returnUrl,
      },
      getIdempotencyOptions(params.idempotencyKey),
    );

    const result: PaymentIntentResult = {
      success: true,
      paymentIntent,
      clientSecret: paymentIntent.client_secret ?? undefined,
    };

    if (params.idempotencyKey) {
      storeIdempotentResult(params.idempotencyKey, result, 3_600_000);
    }

    return result;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    const result: PaymentIntentResult = {
      success: false,
      error: errorMessage,
    };
    return result;
  }
}

export interface ConfirmPaymentIntentParams {
  paymentIntentId: string;
  paymentMethodId?: string;
  returnUrl?: string;
  idempotencyKey?: string;
}

export async function confirmPaymentIntent(
  params: ConfirmPaymentIntentParams,
): Promise<PaymentIntentResult> {
  const stripe = getStripeClient();

  try {
    const paymentIntent = await stripe.paymentIntents.confirm(
      params.paymentIntentId,
      {
        payment_method: params.paymentMethodId,
        return_url: params.returnUrl,
      },
      getIdempotencyOptions(params.idempotencyKey),
    );

    return {
      success: true,
      paymentIntent,
      clientSecret: paymentIntent.client_secret ?? undefined,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return {
      success: false,
      error: errorMessage,
    };
  }
}

export interface CancelPaymentIntentParams {
  paymentIntentId: string;
  cancellationReason?: Stripe.PaymentIntentCancelParams.CancellationReason;
  idempotencyKey?: string;
}

export async function cancelPaymentIntent(
  params: CancelPaymentIntentParams,
): Promise<PaymentIntentResult> {
  const stripe = getStripeClient();

  try {
    const paymentIntent = await stripe.paymentIntents.cancel(
      params.paymentIntentId,
      {
        cancellation_reason: params.cancellationReason,
      },
      getIdempotencyOptions(params.idempotencyKey),
    );

    return {
      success: true,
      paymentIntent,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return {
      success: false,
      error: errorMessage,
    };
  }
}

export interface CapturePaymentIntentParams {
  paymentIntentId: string;
  amountToCapture?: number;
  idempotencyKey?: string;
}

export async function capturePaymentIntent(
  params: CapturePaymentIntentParams,
): Promise<PaymentIntentResult> {
  const stripe = getStripeClient();

  try {
    const paymentIntent = await stripe.paymentIntents.capture(
      params.paymentIntentId,
      {
        amount_to_capture: params.amountToCapture,
      },
      getIdempotencyOptions(params.idempotencyKey),
    );

    return {
      success: true,
      paymentIntent,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return {
      success: false,
      error: errorMessage,
    };
  }
}

export async function getPaymentIntent(
  paymentIntentId: string,
): Promise<PaymentIntentResult> {
  const stripe = getStripeClient();

  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    return {
      success: true,
      paymentIntent,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return {
      success: false,
      error: errorMessage,
    };
  }
}

export interface SubscriptionParams {
  customerId: string;
  priceId: string;
  trialPeriodDays?: number;
  paymentMethodId?: string;
  metadata?: Record<string, string>;
  idempotencyKey?: string;
}

export interface SubscriptionResult {
  success: boolean;
  subscription?: Stripe.Subscription;
  error?: string;
}

export async function createSubscription(
  params: SubscriptionParams,
): Promise<SubscriptionResult> {
  const stripe = getStripeClient();

  try {
    const subscription = await stripe.subscriptions.create(
      {
        customer: params.customerId,
        items: [{ price: params.priceId }],
        trial_period_days: params.trialPeriodDays,
        default_payment_method: params.paymentMethodId,
        metadata: params.metadata,
        payment_behavior: "default_incomplete",
        expand: ["latest_invoice.payment_intent"],
      },
      getIdempotencyOptions(params.idempotencyKey),
    );

    return {
      success: true,
      subscription,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return {
      success: false,
      error: errorMessage,
    };
  }
}

export interface UpdateSubscriptionParams {
  subscriptionId: string;
  priceId?: string;
  quantity?: number;
  metadata?: Record<string, string>;
  prorationBehavior?: Stripe.SubscriptionUpdateParams.ProrationBehavior;
  idempotencyKey?: string;
}

export async function updateSubscription(
  params: UpdateSubscriptionParams,
): Promise<SubscriptionResult> {
  const stripe = getStripeClient();

  try {
    const updateData: Stripe.SubscriptionUpdateParams = {
      metadata: params.metadata,
      proration_behavior: params.prorationBehavior,
    };

    if (params.priceId) {
      const subscription = await stripe.subscriptions.retrieve(params.subscriptionId);
      const existingItem = subscription.items.data[0];

      if (existingItem) {
        updateData.items = [
          {
            id: existingItem.id,
            price: params.priceId,
            quantity: params.quantity,
          },
        ];
      }
    }

    const subscription = await stripe.subscriptions.update(
      params.subscriptionId,
      updateData,
      getIdempotencyOptions(params.idempotencyKey),
    );

    return {
      success: true,
      subscription,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return {
      success: false,
      error: errorMessage,
    };
  }
}

export interface CancelSubscriptionParams {
  subscriptionId: string;
  cancelAtPeriodEnd?: boolean;
  cancellationProrate?: boolean;
  idempotencyKey?: string;
}

export async function cancelSubscription(
  params: CancelSubscriptionParams,
): Promise<SubscriptionResult> {
  const stripe = getStripeClient();

  try {
    let subscription: Stripe.Subscription;

    if (params.cancelAtPeriodEnd) {
      subscription = await stripe.subscriptions.update(
        params.subscriptionId,
        { cancel_at_period_end: true },
        getIdempotencyOptions(params.idempotencyKey),
      );
    } else {
      subscription = await stripe.subscriptions.cancel(
        params.subscriptionId,
        {
          prorate: params.cancellationProrate,
        },
        getIdempotencyOptions(params.idempotencyKey),
      );
    }

    return {
      success: true,
      subscription,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return {
      success: false,
      error: errorMessage,
    };
  }
}

export async function getSubscription(
  subscriptionId: string,
): Promise<SubscriptionResult> {
  const stripe = getStripeClient();

  try {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    return {
      success: true,
      subscription,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return {
      success: false,
      error: errorMessage,
    };
  }
}

export interface RefundParams {
  paymentIntentId: string;
  amount?: number;
  reason?: Stripe.RefundCreateParams.Reason;
  idempotencyKey?: string;
}

export interface RefundResult {
  success: boolean;
  refund?: Stripe.Refund;
  error?: string;
}

export async function createRefund(params: RefundParams): Promise<RefundResult> {
  const stripe = getStripeClient();

  try {
    const refund = await stripe.refunds.create(
      {
        payment_intent: params.paymentIntentId,
        amount: params.amount,
        reason: params.reason,
      },
      getIdempotencyOptions(params.idempotencyKey),
    );

    return {
      success: true,
      refund,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return {
      success: false,
      error: errorMessage,
    };
  }
}
