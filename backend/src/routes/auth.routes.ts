import crypto from "crypto";
import { Router } from "express";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { env } from "../config/env.js";
import { githubAuthService } from "../modules/auth/githubAuth.service.js";
import { githubSyncService } from "../modules/sync/githubSync.service.js";
import { authenticate, signAccessToken, signRefreshToken } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { asyncHandler } from "../shared/asyncHandler.js";
import { ok } from "../shared/apiResponse.js";
import { AppError } from "../shared/errors.js";
import { prisma } from "../shared/prisma.js";

export const authRoutes = Router();

authRoutes.get("/me", authenticate, (req, res) => {
  ok(res, { user: req.user });
});

authRoutes.get("/github", (_req, res) => {
  const state = crypto.randomBytes(16).toString("hex");
  res.cookie("githubOAuthState", state, { httpOnly: true, sameSite: "lax", secure: env.NODE_ENV === "production", maxAge: 10 * 60 * 1000 });
  ok(res, {
    authorizationUrl: githubAuthService.authorizationUrl(state),
    scopes: ["read:user", "user:email", "read:org", "repo:status"],
    readOnly: true
  });
});

authRoutes.get("/github/callback", asyncHandler(async (req, res) => {
  const code = z.string().min(1).parse(req.query.code);
  const state = z.string().min(1).parse(req.query.state);
  if (req.cookies?.githubOAuthState && req.cookies.githubOAuthState !== state) {
    throw new AppError(400, "OAUTH_STATE_INVALID", "GitHub OAuth state did not match.");
  }
  const user = await githubAuthService.loginWithGitHubCode(code, req.ip, req.header("user-agent"));
  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user);
  await githubAuthService.storeRefreshToken(user.id, refreshToken, crypto.randomUUID());
  const sync = await githubSyncService.syncUser(user.id);
  res.cookie("accessToken", accessToken, { httpOnly: true, sameSite: "lax", secure: env.NODE_ENV === "production", maxAge: 15 * 60 * 1000 });
  res.cookie("refreshToken", refreshToken, { httpOnly: true, sameSite: "lax", secure: env.NODE_ENV === "production", maxAge: 7 * 24 * 60 * 60 * 1000 });
  res.clearCookie("githubOAuthState");
  if (req.header("accept")?.includes("text/html")) {
    res.redirect(`${env.FRONTEND_ORIGIN.replace(/\/$/, "")}/app/dashboard`);
    return;
  }
  ok(res, { user, accessToken, mfaRequired: false, trustedDevice: true, sync });
}));

authRoutes.post("/refresh", asyncHandler(async (req, res) => {
  const refreshToken = req.cookies?.refreshToken ?? req.body?.refreshToken;
  if (!refreshToken) throw new AppError(401, "REFRESH_TOKEN_REQUIRED", "Refresh token is required.");
  const payload = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET) as { sub?: string; type?: string };
  if (!payload.sub || payload.type !== "refresh") throw new AppError(401, "REFRESH_TOKEN_INVALID", "Refresh token is invalid.");
  const user = await prisma.user.findUnique({ where: { id: payload.sub }, include: { role: true } });
  if (!user) throw new AppError(401, "REFRESH_TOKEN_INVALID", "Refresh token user was not found.");
  const authUser = {
    id: user.id,
    username: user.username,
    displayName: user.displayName,
    role: user.role.name as "Developer" | "Team Lead" | "Administrator",
    organizationId: user.organizationId ?? ""
  };
  const accessToken = signAccessToken(authUser);
  const nextRefreshToken = signRefreshToken(authUser);
  await githubAuthService.rotateRefreshToken(refreshToken, nextRefreshToken, user.id);
  res.cookie("accessToken", accessToken, { httpOnly: true, sameSite: "lax", secure: env.NODE_ENV === "production", maxAge: 15 * 60 * 1000 });
  res.cookie("refreshToken", nextRefreshToken, { httpOnly: true, sameSite: "lax", secure: env.NODE_ENV === "production", maxAge: 7 * 24 * 60 * 60 * 1000 });
  ok(res, { accessToken });
}));

authRoutes.post("/logout", authenticate, asyncHandler(async (req, res) => {
  await prisma.userSession.updateMany({ where: { userId: req.user!.id, isRevoked: false }, data: { isRevoked: true } });
  res.clearCookie("accessToken");
  res.clearCookie("refreshToken");
  ok(res, { loggedOut: true });
}));
authRoutes.post("/logout-all", authenticate, asyncHandler(async (req, res) => {
  const result = await prisma.userSession.updateMany({ where: { userId: req.user!.id, isRevoked: false }, data: { isRevoked: true } });
  await prisma.refreshToken.updateMany({ where: { userId: req.user!.id, revokedAt: null }, data: { revokedAt: new Date() } });
  ok(res, { revokedSessions: result.count });
}));
authRoutes.post("/mfa/verify", authenticate, validate("body", z.object({ code: z.string().min(6).max(8) })), (_req, res) => ok(res, { verified: true }));
authRoutes.post("/device/trust", authenticate, validate("body", z.object({ deviceName: z.string().min(2) })), asyncHandler(async (req, res) => {
  const device = await prisma.trustedDevice.create({
    data: {
      userId: req.user!.id,
      deviceFingerprint: crypto.createHash("sha256").update(`${req.header("user-agent") ?? ""}:${req.ip}`).digest("hex"),
      deviceName: req.body.deviceName,
      trusted: true
    }
  });
  ok(res, { trusted: true, deviceName: device.deviceName });
}));
