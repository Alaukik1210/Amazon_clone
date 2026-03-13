import { Role } from "@prisma/client";

// Augment Express Request to carry authenticated user info after JWT verification
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        role: Role;
      };
    }
  }
}
