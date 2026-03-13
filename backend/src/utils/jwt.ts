import jwt from "jsonwebtoken";
import { env } from "../config/env";
import type { Role } from "@prisma/client";

export interface JwtPayload {
  userId: string;
  role: Role;
}

export function generateToken(userId: string, role: Role): string {
  return jwt.sign({ userId, role }, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn as jwt.SignOptions["expiresIn"],
  });
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, env.jwtSecret) as JwtPayload;
}
