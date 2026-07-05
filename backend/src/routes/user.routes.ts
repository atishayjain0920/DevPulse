import { Router } from "express";
import { z } from "zod";
import { authenticate } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { asyncHandler } from "../shared/asyncHandler.js";
import { ok } from "../shared/apiResponse.js";
import { prisma } from "../shared/prisma.js";

export const userRoutes = Router();
userRoutes.use(authenticate);

userRoutes.get("/me", asyncHandler(async (req, res) => ok(res, await prisma.user.findUnique({ where: { id: req.user!.id }, include: { role: true, organization: true } }))));
userRoutes.put("/me", validate("body", z.object({ displayName: z.string().min(2).optional(), bio: z.string().max(280).optional() })), asyncHandler(async (req, res) => ok(res, await prisma.user.update({ where: { id: req.user!.id }, data: req.body, include: { role: true } }))));
userRoutes.get("/preferences", asyncHandler(async (req, res) => ok(res, await prisma.dashboardPreference.findUnique({ where: { userId: req.user!.id } }))));
userRoutes.put("/preferences", validate("body", z.record(z.unknown())), asyncHandler(async (req, res) => {
  const body = req.body as Record<string, unknown>;
  ok(res, await prisma.dashboardPreference.upsert({
    where: { userId: req.user!.id },
    create: { userId: req.user!.id, layout: body.layout ?? {}, pinnedRepositories: body.pinnedRepositories ?? [], selectedWidgets: body.selectedWidgets ?? [], theme: String(body.theme ?? "system") },
    update: { layout: body.layout ?? undefined, pinnedRepositories: body.pinnedRepositories ?? undefined, selectedWidgets: body.selectedWidgets ?? undefined, theme: body.theme ? String(body.theme) : undefined }
  }));
}));
