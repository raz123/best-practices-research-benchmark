/**
 * Custom error class for HTTP errors.
 *
 * Usage:
 *   throw new AppError('User not found', 404);
 *   throw new AppError('Invalid input', 400, { isOperational: true });
 */

export interface AppErrorOptions {
  /** Whether this is an expected/operational error (default: true) */
  isOperational?: boolean;
  /** Extra context for logging — never sent to clients */
  context?: Record<string, unknown>;
}

export class AppError extends Error {
  /** HTTP status code */
  readonly statusCode: number;

  /** Operational errors are expected business-logic failures; unexpected errors are programming bugs */
  readonly isOperational: boolean;

  /** Extra context for logging — intentionally not part of the public Error shape */
  readonly context?: Record<string, unknown>;

  constructor(
    message: string,
    statusCode: number = 500,
    options: AppErrorOptions = {},
  ) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.isOperational = options.isOperational ?? true;
    this.context = options.context;

    // Fix prototype chain for correct instanceof checks
    Object.setPrototypeOf(this, AppError.prototype);

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AppError);
    }
  }

  /**
   * Type guard — true if the value is an AppError with a valid statusCode.
   */
  static isAppError(value: unknown): value is AppError {
    return value instanceof AppError && typeof value.statusCode === 'number';
  }
}
