import { Router } from "express";
import { z } from "zod";
import { authenticate } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { asyncHandler } from "../shared/asyncHandler.js";
import { ok } from "../shared/apiResponse.js";
import { prisma } from "../shared/prisma.js";

export const reportRoutes = Router();
reportRoutes.use(authenticate);

const reportRequest = z.object({
  reportType: z.enum(["developer", "repository", "organization", "weekly", "monthly", "executive"]),
  dateRange: z.object({ from: z.string(), to: z.string() }).optional()
});

async function queued(userId: string, format: "pdf" | "excel" | "csv", body: z.infer<typeof reportRequest>) {
  return prisma.exportJob.create({
    data: {
      userId,
      reportType: body.reportType,
      format,
      status: "queued"
    }
  });
}

reportRoutes.post("/pdf", validate("body", reportRequest), asyncHandler(async (req, res) => ok(res, await queued(req.user!.id, "pdf", req.body), undefined, 202)));
reportRoutes.post("/excel", validate("body", reportRequest), asyncHandler(async (req, res) => ok(res, await queued(req.user!.id, "excel", req.body), undefined, 202)));
reportRoutes.post("/csv", validate("body", reportRequest), asyncHandler(async (req, res) => ok(res, await queued(req.user!.id, "csv", req.body), undefined, 202)));
reportRoutes.get("/history", asyncHandler(async (req, res) => ok(res, await prisma.exportJob.findMany({ where: { userId: req.user!.id }, orderBy: { requestedAt: "desc" } }))));
