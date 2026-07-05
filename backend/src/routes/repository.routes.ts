import { Router } from "express";
import { z } from "zod";
import { authenticate } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { asyncHandler } from "../shared/asyncHandler.js";
import { ok } from "../shared/apiResponse.js";
import { analyticsService } from "../modules/analytics/analytics.service.js";
import { repositoryService } from "../modules/repositories/repository.service.js";

export const repositoryRoutes = Router();
repositoryRoutes.use(authenticate);

const idParam = z.object({ id: z.string().min(1) });

repositoryRoutes.get("/", asyncHandler(async (_req, res) => ok(res, await repositoryService.list())));
repositoryRoutes.get("/:id", validate("params", idParam), asyncHandler(async (req, res) => ok(res, await repositoryService.details(String(req.params.id)))));
repositoryRoutes.get("/:id/contributors", validate("params", idParam), asyncHandler(async (req, res) => ok(res, await repositoryService.contributors(String(req.params.id)))));
repositoryRoutes.get("/:id/branches", validate("params", idParam), asyncHandler(async (req, res) => ok(res, await repositoryService.branches(String(req.params.id)))));
repositoryRoutes.get("/:id/health", validate("params", idParam), asyncHandler(async (req, res) => ok(res, await analyticsService.calculateRepositoryHealth(String(req.params.id)))));
repositoryRoutes.post("/:id/sync", validate("params", idParam), asyncHandler(async (req, res) => ok(res, await repositoryService.sync(String(req.params.id)), undefined, 202)));
