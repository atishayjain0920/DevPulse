import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import { analyticsService } from "../modules/analytics/analytics.service.js";
import { asyncHandler } from "../shared/asyncHandler.js";
import { ok } from "../shared/apiResponse.js";
import { prisma } from "../shared/prisma.js";

export const workflowRoutes = Router();
workflowRoutes.use(authenticate);

workflowRoutes.get("/", asyncHandler(async (_req, res) => ok(res, await prisma.workflow.findMany({ include: { repository: true }, orderBy: { name: "asc" } }))));
workflowRoutes.get("/runs", asyncHandler(async (_req, res) => ok(res, await prisma.workflowRun.findMany({ include: { workflow: { include: { repository: true } } }, orderBy: { startedAt: "desc" } }))));
workflowRoutes.get("/failures", asyncHandler(async (_req, res) => ok(res, await prisma.workflowRun.findMany({ where: { conclusion: "failure" }, include: { workflow: { include: { repository: true } } }, orderBy: { startedAt: "desc" } }))));
workflowRoutes.get("/deployments", asyncHandler(async (_req, res) => {
  const deployments = await prisma.deployment.findMany({ include: { workflowRun: true }, orderBy: { deployedAt: "desc" } });
  ok(res, {
    deployments: deployments.length,
    successful: deployments.filter((deployment) => deployment.deploymentStatus === "success").length,
    failed: deployments.filter((deployment) => deployment.deploymentStatus === "failure").length,
    averageDeploymentTime: Math.round(deployments.reduce((sum, deployment) => sum + (deployment.deploymentDuration ?? 0), 0) / (deployments.length || 1))
  });
}));
workflowRoutes.get("/statistics", asyncHandler(async (_req, res) => ok(res, await analyticsService.getWorkflowStatistics())));
workflowRoutes.get("/:id", asyncHandler(async (req, res) => ok(res, await prisma.workflow.findUnique({ where: { id: String(req.params.id) }, include: { repository: true, runs: { orderBy: { startedAt: "desc" }, take: 20 } } }))));
