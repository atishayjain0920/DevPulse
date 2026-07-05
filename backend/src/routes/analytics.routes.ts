import { Router } from "express";
import { z } from "zod";
import { authenticate } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { asyncHandler } from "../shared/asyncHandler.js";
import { ok } from "../shared/apiResponse.js";
import { analyticsService } from "../modules/analytics/analytics.service.js";

export const analyticsRoutes = Router();
analyticsRoutes.use(authenticate);

const filters = z.object({
  repositoryId: z.string().optional(),
  developerId: z.string().optional(),
  organizationId: z.string().optional(),
  from: z.string().optional(),
  to: z.string().optional()
});

analyticsRoutes.get("/commits", validate("query", filters), asyncHandler(async (_req, res) => ok(res, await analyticsService.getCommitSummary())));
analyticsRoutes.get("/commits/trend", validate("query", filters), asyncHandler(async (_req, res) => ok(res, await analyticsService.getCommitTrend())));
analyticsRoutes.get("/commits/heatmap", validate("query", filters), asyncHandler(async (_req, res) => ok(res, await analyticsService.getHeatmap())));
analyticsRoutes.get("/commits/churn", validate("query", filters), asyncHandler(async (_req, res) => ok(res, await analyticsService.getChurn())));
