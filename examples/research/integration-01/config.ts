/**
 * Stripe configuration and client initialization.
 *
 * Centralizes all Stripe-related configuration with type-safe environment
 * variable access and a singleton client instance.
 *
 * Best practices:
 * - Never log secret keys
 * - Support multiple signing secrets for rotation
 * - Pin API version for deterministic behavior
 * - Fail fast on missing required config
 */

import Stripe from "stripe";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface StripeConfig {
  secretKey: string;
  webhookSecrets: string[];
  apiVersion: string;
}

// ---------------------------------------------------------------------------
// Environment validation
// ---------------------------------------------------------------------------

function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

function optionalEnv(key: string): string | undefined {
  return process.env[key];
}

// ---------------------------------------------------------------------------
// Config loading
// ---------------------------------------------------------------------------

let _config: StripeConfig | null = null;

/**
 * Load and cache Stripe configuration from environment variables.
 * Throws on first call if required variables are missing.
 *
 * Environment variables:
 * - STRIPE_SECRET_KEY (required): Stripe secret API key (sk_...)
 * - STRIPE_WEBHOOK_SECRET (required): Primary webhook signing secret (whsec_...)
 * - STRIPE_WEBHOOK_SECRET_ALT (optional): Secondary secret for rotation windows
 * - STRIPE_API_VERSION (optional): Pinned API version (default: '2024-12-18.acacia')
 */
export function getStripeConfig(): StripeConfig {
  if (_config) return _config;

  const secretKey = requireEnv("STRIPE_SECRET_KEY");

  const webhookSecrets: string[] = [];
  const primary = requireEnv("STRIPE_WEBHOOK_SECRET");
  const alt = optionalEnv("STRIPE_WEBHOOK_SECRET_ALT");

  webhookSecrets.push(primary);
  if (alt) webhookSecrets.push(alt);

  _config = {
    secretKey,
    webhookSecrets,
    apiVersion: optionalEnv("STRIPE_API_VERSION") ?? "2024-12-18.acacia",
  };

  return _config;
}

/**
 * Reset cached config (useful for testing).
 */
export function resetStripeConfig(): void {
  _config = null;
}

// ---------------------------------------------------------------------------
// Stripe client singleton
// ---------------------------------------------------------------------------

let _stripe: Stripe | null = null;

/**
 * Get or create a Stripe client instance.
 * Uses the cached config; call getStripeConfig() internally.
 */
export function getStripeClient(): Stripe {
  if (_stripe) return _stripe;

  const config = getStripeConfig();
  _stripe = new Stripe(config.secretKey, {
    apiVersion: config.apiVersion as Stripe.LatestApiVersion,
  });

  return _stripe;
}

/**
 * Reset the Stripe client (useful for testing).
 */
export function resetStripeClient(): void {
  _stripe = null;
}
