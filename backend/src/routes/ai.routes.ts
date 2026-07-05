import { Router } from "express";
import { z } from "zod";
import { authenticate } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { asyncHandler } from "../shared/asyncHandler.js";
import { ok } from "../shared/apiResponse.js";
import { aiService } from "../modules/ai/ai.service.js";

export const aiRoutes = Router();
aiRoutes.use(authenticate);

aiRoutes.post("/chat", validate("body", z.object({ question: z.string().min(2).max(500), conversationId: z.string().optional() })), asyncHandler(async (req, res) => ok(res, await aiService.chat(req.body.question, req.user!.id))));
aiRoutes.get("/weekly-summary", asyncHandler(async (req, res) => ok(res, await aiService.weeklySummary(req.user!.id))));
aiRoutes.get("/executive-summary", asyncHandler(async (req, res) => ok(res, await aiService.executiveSummary(req.user!.id))));
aiRoutes.get("/repository-summary/:id", asyncHandler(async (req, res) => ok(res, await aiService.repositorySummary(String(req.params.id)))));
aiRoutes.get("/recommendations", asyncHandler(async (_req, res) => ok(res, await aiService.recommendations())));
aiRoutes.get("/risks", asyncHandler(async (_req, res) => ok(res, await aiService.risks())));
