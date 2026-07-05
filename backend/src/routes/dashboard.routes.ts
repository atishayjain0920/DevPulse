import { Router } from "express";
import { authenticate, authorize } from "../middleware/auth.js";
import { asyncHandler } from "../shared/asyncHandler.js";
import { ok } from "../shared/apiResponse.js";
import { dashboardService } from "../modules/dashboard/dashboard.service.js";

export const dashboardRoutes = Router();
dashboardRoutes.use(authenticate);

dashboardRoutes.get("/developer", asyncHandler(async (req, res) => ok(res, await dashboardService.developerDashboard(req.user!.id))));
dashboardRoutes.get("/executive", authorize("Team Lead"), asyncHandler(async (req, res) => ok(res, await dashboardService.executiveDashboard(req.user!.id))));
dashboardRoutes.get("/repository/:id", asyncHandler(async (req, res) => ok(res, await dashboardService.repositoryDashboard(String(req.params.id)))));
dashboardRoutes.get("/team", authorize("Team Lead"), asyncHandler(async (req, res) => ok(res, await dashboardService.teamDashboard(req.user!.id))));
