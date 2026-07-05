import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import { analyticsService } from "../modules/analytics/analytics.service.js";
import { asyncHandler } from "../shared/asyncHandler.js";
import { ok } from "../shared/apiResponse.js";
import { prisma } from "../shared/prisma.js";

export const pullRequestRoutes = Router();
pullRequestRoutes.use(authenticate);

pullRequestRoutes.get("/", asyncHandler(async (_req, res) => ok(res, await prisma.pullRequest.findMany({ include: { repository: true, author: true, reviews: true }, orderBy: { createdAtGitHub: "desc" } }))));
pullRequestRoutes.get("/stale", asyncHandler(async (_req, res) => ok(res, await prisma.pullRequest.findMany({ where: { state: "OPEN", createdAtGitHub: { lt: new Date(Date.now() - 48 * 36e5) } }, include: { repository: true, author: true }, orderBy: { createdAtGitHub: "asc" } }))));
pullRequestRoutes.get("/reviews", asyncHandler(async (_req, res) => {
  const reviews = await prisma.pullRequestReview.groupBy({ by: ["reviewerId"], _count: { id: true }, _avg: { reviewDuration: true } });
  ok(res, reviews.map((review) => ({ reviewerId: review.reviewerId, completed: review._count.id, averageReviewTime: Math.round(review._avg.reviewDuration ?? 0) })));
}));
pullRequestRoutes.get("/statistics", asyncHandler(async (_req, res) => ok(res, await analyticsService.getPullRequestStatistics())));
pullRequestRoutes.get("/:id", asyncHandler(async (req, res) => ok(res, await prisma.pullRequest.findUnique({ where: { id: String(req.params.id) }, include: { repository: true, author: true, reviews: true } }))));
