import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import { asyncHandler } from "../shared/asyncHandler.js";
import { ok } from "../shared/apiResponse.js";
import { prisma } from "../shared/prisma.js";

export const notificationRoutes = Router();
notificationRoutes.use(authenticate);

notificationRoutes.get("/", asyncHandler(async (req, res) => {
  ok(res, await prisma.notification.findMany({ where: { userId: req.user!.id, deletedAt: null }, orderBy: { createdAt: "desc" } }));
}));
notificationRoutes.put("/read/:id", asyncHandler(async (req, res) => {
  ok(res, await prisma.notification.update({ where: { id: String(req.params.id) }, data: { isRead: true } }));
}));
notificationRoutes.put("/read-all", asyncHandler(async (req, res) => {
  const result = await prisma.notification.updateMany({ where: { userId: req.user!.id, isRead: false, deletedAt: null }, data: { isRead: true } });
  ok(res, { updated: result.count });
}));
notificationRoutes.delete("/:id", asyncHandler(async (req, res) => {
  await prisma.notification.update({ where: { id: String(req.params.id) }, data: { deletedAt: new Date() } });
  ok(res, { id: String(req.params.id), deleted: true });
}));
