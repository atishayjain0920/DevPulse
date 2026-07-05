import { Router } from "express";
import { z } from "zod";
import { authenticate } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { ensureUserSettings, updateUserSettings } from "../modules/settings/settings.service.js";
import { asyncHandler } from "../shared/asyncHandler.js";
import { ok } from "../shared/apiResponse.js";

export const settingsRoutes = Router();
settingsRoutes.use(authenticate);

settingsRoutes.get("/", asyncHandler(async (req, res) => {
  ok(res, await ensureUserSettings(req.user!.id));
}));

settingsRoutes.put("/", validate("body", z.record(z.unknown())), asyncHandler(async (req, res) => {
  ok(res, await updateUserSettings(req.user!.id, req.body as Record<string, unknown>));
}));
