import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { toAuthUser } from "../modules/auth/githubAuth.service.js";
import { AppError } from "../shared/errors.js";
import { prisma } from "../shared/prisma.js";
import type { AuthUser, RoleName } from "../shared/types.js";

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

const roleRank: Record<RoleName, number> = {
  Developer: 1,
  "Team Lead": 2,
  Administrator: 3
};

export function signAccessToken(user: AuthUser): string {
  return jwt.sign({ sub: user.id, username: user.username, role: user.role }, env.JWT_ACCESS_SECRET, { expiresIn: "15m" });
}

export function signRefreshToken(user: AuthUser): string {
  return jwt.sign({ sub: user.id, type: "refresh" }, env.JWT_REFRESH_SECRET, { expiresIn: "7d" });
}

export async function authenticate(req: Request, _res: Response, next: NextFunction): Promise<void> {
  const header = req.header("authorization");
  const token = header?.startsWith("Bearer ") ? header.slice(7) : req.cookies?.accessToken;
  if (!token) {
    next(new AppError(401, "UNAUTHORIZED", "Authentication is required."));
    return;
  }
  try {
    const payload = jwt.verify(token, env.JWT_ACCESS_SECRET) as { sub?: string };
    if (!payload.sub) throw new Error("Missing subject");
    const user = await prisma.user.findUnique({ where: { id: payload.sub }, include: { role: true } });
    if (!user || user.accountStatus !== "ACTIVE") {
      next(new AppError(401, "USER_INACTIVE", "Authenticated user is not active."));
      return;
    }
    req.user = toAuthUser(user);
    next();
  } catch {
    next(new AppError(401, "TOKEN_INVALID", "The access token is invalid or expired."));
  }
}

export function authorize(minimumRole: RoleName) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) throw new AppError(401, "UNAUTHORIZED", "Authentication is required.");
    if (roleRank[req.user.role] < roleRank[minimumRole]) {
      throw new AppError(403, "FORBIDDEN", "You do not have permission to access this resource.");
    }
    next();
  };
}
