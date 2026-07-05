import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import { asyncHandler } from "../shared/asyncHandler.js";
import { ok } from "../shared/apiResponse.js";
import { profileService } from "../modules/profile/profile.service.js";

export const profileRoutes = Router();
profileRoutes.use(authenticate);

profileRoutes.get("/", asyncHandler(async (req, res) => ok(res, await profileService.profile(req.user!.id))));
profileRoutes.get("/activity", asyncHandler(async (req, res) => ok(res, (await profileService.profile(req.user!.id)).activity)));
profileRoutes.get("/achievements", asyncHandler(async (req, res) => ok(res, await profileService.achievements(req.user!.id))));
profileRoutes.get("/productivity", asyncHandler(async (req, res) => ok(res, await profileService.productivity(req.user!.id))));
