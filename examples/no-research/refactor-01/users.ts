import { Router, Request, Response, NextFunction } from "express";
import { AppError } from "../utils/AppError";

// Type-safe async handler wrapper — catches rejections and forwards to error middleware.
function asyncHandler(
  fn: (req: Request, res: Response) => Promise<void>,
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    fn(req, res).catch(next);
  };
}

// ── In-memory store (replace with DB in production) ──────────────────────────
interface User {
  id: number;
  name: string;
  email: string;
}

let users: User[] = [
  { id: 1, name: "Alice", email: "alice@example.com" },
  { id: 2, name: "Bob", email: "bob@example.com" },
];

let nextId = 3;

// ── Routes ───────────────────────────────────────────────────────────────────
const router = Router();

// GET /users — list all users
router.get(
  "/",
  asyncHandler(async (_req: Request, res: Response): Promise<void> => {
    res.json({ users });
  }),
);

// GET /users/:id — get user by ID
router.get(
  "/:id",
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const id = Number(req.params.id);
    const user = users.find((u) => u.id === id);

    if (!user) {
      throw new AppError(`User ${id} not found`, 404);
    }

    res.json({ user });
  }),
);

// POST /users — create a new user
router.post(
  "/",
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { name, email } = req.body as { name?: string; email?: string };

    if (!name || !email) {
      throw new AppError("Name and email are required", 400);
    }

    if (users.some((u) => u.email === email)) {
      throw new AppError("Email already in use", 409);
    }

    const user: User = { id: nextId++, name, email };
    users.push(user);

    res.status(201).json({ user });
  }),
);

// PUT /users/:id — update an existing user
router.put(
  "/:id",
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const id = Number(req.params.id);
    const index = users.findIndex((u) => u.id === id);

    if (index === -1) {
      throw new AppError(`User ${id} not found`, 404);
    }

    const { name, email } = req.body as { name?: string; email?: string };

    if (email && email !== users[index].email) {
      if (users.some((u) => u.email === email)) {
        throw new AppError("Email already in use", 409);
      }
    }

    users[index] = {
      ...users[index],
      ...(name && { name }),
      ...(email && { email }),
    };

    res.json({ user: users[index] });
  }),
);

// DELETE /users/:id — remove a user
router.delete(
  "/:id",
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const id = Number(req.params.id);
    const index = users.findIndex((u) => u.id === id);

    if (index === -1) {
      throw new AppError(`User ${id} not found`, 404);
    }

    users.splice(index, 1);
    res.status(204).send();
  }),
);

export default router;
