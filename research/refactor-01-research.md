# Express.js Async/Await & Error Handling — Best Practices Research

## Task: Refactor Express callbacks → async/await with centralized error handling
- Task type: refactor
- Date: 2026-06-28

## Core Pattern: asyncHandler wrapper

- Wrap every async route handler so rejected promises forward to `next(err)`
- Pattern: `const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);`
- This is preferred over try/catch in every route — single source of truth
- `express-async-errors` monkey-patches Express internals; the wrapper is explicit and testable

## Custom Error Class (AppError)

- Extend `Error` with `statusCode` (or `status`) and `isOperational` flag
- Set `Object.setPrototypeOf(this, AppError.prototype)` for correct `instanceof`
- `isOperational = true` for expected errors (400, 404, 403); `false` for unexpected (500)
- `Error.captureStackTrace(this, this.constructor)` for clean stack traces

## Centralized Error Middleware

- Must be registered AFTER all routes (last `app.use`)
- Signature: `(err, req, res, next) => ...`
- Branch on `err instanceof AppError`:
  - Operational errors → return `err.statusCode` + `err.message`
  - Unknown errors → log full stack, return 500 + generic message
- Never leak stack traces in production responses
- Always send a response — never leave the connection hanging

## TypeScript Considerations

- Error handler params: `(err: unknown, req: Request, res: Response, next: NextFunction)`
- Narrow `err` with `instanceof` checks — never `as any`
- Express 4 does not recognize 4-arg middleware as async; the wrapper handles this
- If using `express-async-errors`, it patches Express's router so async handlers work natively

## Anti-Patterns to Avoid

- `.catch(next)` scattered in individual routes without a wrapper
- Manual try/catch blocks repeated across every handler
- Swallowing errors silently (no response sent, no `next()` call)
- Leaking internal stack traces or DB errors to clients
- Using `res.status(500).send(err.message)` for all errors indiscriminately

## Performance & Security

- Don't log sensitive data (passwords, tokens) in error handlers
- Use request IDs for error correlation in logs
- Consider structured logging (pino/winston) over `console.error`

## Decision: Wrapper approach chosen

- Explicit asyncHandler wrapper (no monkey-patching)
- Custom AppError class with statusCode + isOperational
- Single centralized error middleware at the end of the stack
- All async handlers wrapped with asyncHandler to guarantee error forwarding
