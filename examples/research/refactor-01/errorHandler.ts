/**
 * Centralized Express error-handling middleware.
 *
 * Register AFTER all routes:
 *   app.use(errorHandler);
 *
 * The 4-arg signature is required by Express to识别 this as an error handler.
 */

import type { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError';

/**
 * Structure of a JSON error response sent to clients.
 */
interface ErrorResponse {
  status: 'error';
  message: string;
  code?: string;
}

/**
 * Extract a safe, client-facing error response from an unknown thrown value.
 * Never leaks stack traces, DB internals, or sensitive context.
 */
function toErrorResponse(err: unknown): ErrorResponse {
  if (AppError.isAppError(err)) {
    return {
      status: 'error',
      message: err.message,
      code: err.isOperational ? 'OPERATIONAL' : 'SYSTEM',
    };
  }

  // Generic fallback — never expose internal details
  return {
    status: 'error',
    message: 'Internal Server Error',
    code: 'SYSTEM',
  };
}

/**
 * Express error-handling middleware (4-arg signature).
 */
export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  // Log the full error for debugging (structured logging recommended in production)
  console.error(
    '[error]',
    err instanceof Error ? err.stack ?? err.message : String(err),
  );

  // Operational errors carry a meaningful status; unexpected errors default to 500
  const statusCode = AppError.isAppError(err) ? err.statusCode : 500;
  const body = toErrorResponse(err);

  res.status(statusCode).json(body);
}
