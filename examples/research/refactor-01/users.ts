/**
 * User routes — fully async/await with centralized error handling.
 *
 * Every async handler is wrapped with asyncHandler so rejected promises
 * are automatically forwarded to Express's error middleware.
 */

import { Router, type Request, type Response, type NextFunction } from 'express';
import { AppError } from '../utils/AppError';

// ─── asyncHandler wrapper ─────────────────────────────────────────────────────
// Wraps an async route handler so thrown errors reach the centralized error
// middleware instead of silently crashing or hanging the request.
type AsyncHandler = (req: Request, res: Response, next: NextFunction) => Promise<void>;

function asyncHandler(fn: AsyncHandler) {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

// ─── Stub data store (replace with real DB calls) ─────────────────────────────

interface User {
  id: string;
  name: string;
  email: string;
}

/** Static record used as an in-memory store. Keys are user IDs. */
const users: Record<string, User> = {
  '1': { id: '1', name: 'Alice', email: 'alice@example.com' },
  '2': { id: '2', name: 'Bob', email: 'bob@example.com' },
};

// ─── Routes ───────────────────────────────────────────────────────────────────

const router = Router();

/**
 * GET /users — List all users
 */
router.get(
  '/',
  asyncHandler(async (_req: Request, res: Response) => {
    const allUsers = Object.values(users);
    res.status(200).json({ data: allUsers });
  }),
);

/**
 * GET /users/:id — Get a user by ID
 */
router.get(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    if (!id) {
      throw new AppError('User ID is required', 400);
    }

    const user = users[id];

    if (!user) {
      throw new AppError(`User not found: ${id}`, 404);
    }

    res.status(200).json({ data: user });
  }),
);

/**
 * POST /users — Create a new user
 */
router.post(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const { name, email } = req.body as { name?: string; email?: string };

    if (!name || !email) {
      throw new AppError('Name and email are required', 400);
    }

    // Check for duplicate email
    const existing = Object.values(users).find((u) => u.email === email);
    if (existing) {
      throw new AppError('Email already in use', 409);
    }

    const newUser: User = {
      id: String(Object.keys(users).length + 1),
      name,
      email,
    };

    users[newUser.id] = newUser;

    res.status(201).json({ data: newUser });
  }),
);

/**
 * PUT /users/:id — Update a user
 */
router.put(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    if (!id) {
      throw new AppError('User ID is required', 400);
    }

    const user = users[id];

    if (!user) {
      throw new AppError(`User not found: ${id}`, 404);
    }

    const { name, email } = req.body as { name?: string; email?: string };

    if (name !== undefined) user.name = name;
    if (email !== undefined) user.email = email;

    users[id] = user;

    res.status(200).json({ data: user });
  }),
);

/**
 * DELETE /users/:id — Delete a user
 */
router.delete(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    if (!id) {
      throw new AppError('User ID is required', 400);
    }

    if (!(id in users)) {
      throw new AppError(`User not found: ${id}`, 404);
    }

    delete users[id];

    res.status(204).send();
  }),
);

export default router;
