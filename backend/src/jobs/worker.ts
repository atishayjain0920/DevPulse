import { Worker } from "bullmq";
import { env } from "../config/env.js";
import { logger } from "../config/logger.js";
import { aiService } from "../modules/ai/ai.service.js";
import { analyticsService } from "../modules/analytics/analytics.service.js";
import { githubSyncService } from "../modules/sync/githubSync.service.js";
import { prisma } from "../shared/prisma.js";

type JobData = {
  userId?: string;
  repositoryId?: string;
  reportId?: string;
};

async function generateNotifications() {
  const users = await prisma.user.findMany({ where: { accountStatus: "ACTIVE" } });
  const failedRuns = await prisma.workflowRun.findMany({ where: { conclusion: "failure" }, include: { workflow: { include: { repository: true } } }, take: 20 });
  const stalePrs = await prisma.pullRequest.findMany({ where: { state: "OPEN", createdAtGitHub: { lt: new Date(Date.now() - 48 * 36e5) } }, include: { repository: true }, take: 20 });
  for (const user of users) {
    await Promise.all([
      ...failedRuns.map((run) => prisma.notification.create({
        data: {
          userId: user.id,
          notificationType: "workflow_failure",
          title: `${run.workflow.repository.name} workflow failed`,
          message: `${run.workflow.name} finished with failure.`,
          priority: "high"
        }
      })),
      ...stalePrs.map((pr) => prisma.notification.create({
        data: {
          userId: user.id,
          notificationType: "stale_pull_request",
          title: `${pr.repository.name} PR #${pr.githubPRNumber} needs review`,
          message: pr.title,
          priority: "medium"
        }
      }))
    ]);
  }
}

async function detectRisks(repositoryId?: string) {
  const repositories = await prisma.repository.findMany({ where: repositoryId ? { id: repositoryId } : undefined });
  for (const repository of repositories) {
    const health = await analyticsService.calculateRepositoryHealth(repository.id);
    if (health.overallScore < 50) {
      await prisma.repositoryRisk.create({
        data: {
          repositoryId: repository.id,
          riskType: "repository_health",
          severity: "HIGH",
          title: `${repository.name} health is critical`,
          description: `Repository health score is ${health.overallScore}.`,
          recommendation: "Review failing builds, stale pull requests, and inactive branches."
        }
      });
    }
  }
}

async function generateAiSummaries(userId?: string) {
  const users = userId ? await prisma.user.findMany({ where: { id: userId } }) : await prisma.user.findMany({ where: { accountStatus: "ACTIVE" } });
  for (const user of users) {
    const summary = await aiService.weeklySummary(user.id);
    await prisma.aISummary.create({
      data: {
        userId: user.id,
        summaryType: "Weekly",
        content: summary.sections.overallProductivity,
        modelName: summary.modelName,
        confidence: summary.confidence
      }
    });
  }
}

async function handleJob(name: string, data: JobData) {
  switch (name) {
    case "github.sync":
      return data.userId ? githubSyncService.syncUser(data.userId) : null;
    case "repository.sync":
    case "commit.sync":
    case "pr.sync":
    case "workflow.sync":
    case "issue.sync":
      return data.repositoryId ? githubSyncService.syncRepository(data.repositoryId) : data.userId ? githubSyncService.syncUser(data.userId) : null;
    case "notification.generate":
    case "notification.deliver":
      return generateNotifications();
    case "risk.detect":
    case "repository.health.recalculate":
      return detectRisks(data.repositoryId);
    case "ai.weekly-summary":
      return generateAiSummaries(data.userId);
    case "developer.productivity.recalculate":
      return data.userId ? analyticsService.calculateProductivityScore(data.userId) : null;
    case "report.generate":
      return data.reportId ? prisma.exportJob.update({ where: { id: data.reportId }, data: { status: "completed", completedAt: new Date() } }) : null;
    case "sessions.cleanup":
      return prisma.userSession.updateMany({ where: { expiresAt: { lt: new Date() }, isRevoked: false }, data: { isRevoked: true } });
    case "analytics.cache.refresh":
      return analyticsService.getEngineeringKpis(data.userId);
    default:
      throw new Error(`Unsupported job: ${name}`);
  }
}

export function createWorker() {
  const worker = new Worker("devpulse", (job) => handleJob(job.name, job.data as JobData), {
    connection: { url: env.REDIS_URL },
    concurrency: 4
  });
  worker.on("completed", (job) => logger.info({ jobId: job.id, name: job.name }, "Job completed"));
  worker.on("failed", (job, error) => logger.error({ jobId: job?.id, name: job?.name, error }, "Job failed"));
  return worker;
}

if (process.argv[1]?.endsWith("worker.js") || process.argv[1]?.endsWith("worker.ts")) {
  createWorker();
  logger.info("DevPulse worker listening");
}
