import crypto from "crypto";
import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import { asyncHandler } from "../shared/asyncHandler.js";
import { ok } from "../shared/apiResponse.js";
import { prisma } from "../shared/prisma.js";

export const securityRoutes = Router();
securityRoutes.use(authenticate);

securityRoutes.get("/sessions", asyncHandler(async (req, res) => ok(res, await prisma.userSession.findMany({ where: { userId: req.user!.id }, orderBy: { lastActivity: "desc" } }))));
securityRoutes.delete("/session/:id", asyncHandler(async (req, res) => {
  await prisma.userSession.update({ where: { id: String(req.params.id) }, data: { isRevoked: true } });
  ok(res, { id: String(req.params.id), revoked: true });
}));
securityRoutes.get("/devices", asyncHandler(async (req, res) => ok(res, await prisma.trustedDevice.findMany({ where: { userId: req.user!.id }, orderBy: { lastUsed: "desc" } }))));
securityRoutes.delete("/device/:id", asyncHandler(async (req, res) => {
  await prisma.trustedDevice.delete({ where: { id: String(req.params.id) } });
  ok(res, { id: String(req.params.id), removed: true });
}));
securityRoutes.get("/audit", asyncHandler(async (req, res) => ok(res, await prisma.auditLog.findMany({ where: { userId: req.user!.id }, orderBy: { createdAt: "desc" }, take: 100 }))));
securityRoutes.post("/mfa", asyncHandler(async (req, res) => {
  await prisma.user.update({ where: { id: req.user!.id }, data: { isMFAEnabled: true } });
  const recoveryCodes = Array.from({ length: 6 }, () => crypto.randomBytes(6).toString("hex").toUpperCase());
  ok(res, { mfaEnabled: true, recoveryCodes });
}));
