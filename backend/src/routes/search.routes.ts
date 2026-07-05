import { Router } from "express";
import { z } from "zod";
import { authenticate } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { asyncHandler } from "../shared/asyncHandler.js";
import { ok } from "../shared/apiResponse.js";
import { prisma } from "../shared/prisma.js";

export const searchRoutes = Router();
searchRoutes.use(authenticate);

searchRoutes.get("/", validate("query", z.object({ q: z.string().min(1), type: z.string().optional() })), asyncHandler(async (req, res) => {
  const query = String(req.query.q);
  await prisma.searchHistory.create({ data: { userId: req.user!.id, query, filters: { type: req.query.type } } });
  ok(res, {
    repositories: await prisma.repository.findMany({ where: { OR: [{ name: { contains: query, mode: "insensitive" } }, { fullName: { contains: query, mode: "insensitive" } }] }, take: 20 }),
    developers: await prisma.user.findMany({ where: { OR: [{ displayName: { contains: query, mode: "insensitive" } }, { username: { contains: query, mode: "insensitive" } }] }, take: 20 }),
    commits: await prisma.commit.findMany({ where: { message: { contains: query, mode: "insensitive" } }, include: { repository: true, author: true }, take: 20 }),
    pullRequests: await prisma.pullRequest.findMany({ where: { title: { contains: query, mode: "insensitive" } }, include: { repository: true, author: true }, take: 20 }),
    workflows: await prisma.workflowRun.findMany({ where: { OR: [{ workflow: { name: { contains: query, mode: "insensitive" } } }, { commitSHA: { contains: query, mode: "insensitive" } }] }, include: { workflow: { include: { repository: true } } }, take: 20 })
  });
}));
