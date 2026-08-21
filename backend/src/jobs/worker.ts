import { Worker } from "bullmq";
import { Redis } from "ioredis";
import fs from "fs/promises";
import path from "path";
import { env } from "../config/env.js";
import { logger } from "../config/logger.js";
import { aiService } from "../modules/ai/ai.service.js";
import { analyticsService } from "../modules/analytics/analytics.service.js";
import { githubSyncService } from "../modules/sync/githubSync.service.js";
import { prisma } from "../shared/prisma.js";
import { emitter } from "../realtime/socket.js";

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
    for (const run of failedRuns) {
      const title = `${run.workflow.repository.name} workflow failed`;
      const exists = await prisma.notification.findFirst({ where: { userId: user.id, title, createdAt: { gte: new Date(Date.now() - 24 * 36e5) } } });
      if (!exists) {
        const notif = await prisma.notification.create({
          data: {
            userId: user.id,
            notificationType: "workflow_failure",
            title,
            message: `${run.workflow.name} finished with failure.`,
            priority: "high"
          }
        });
        emitter.to(`user_${user.id}`).emit("notification.new", notif);
      }
    }
    for (const pr of stalePrs) {
      const title = `${pr.repository.name} PR #${pr.githubPRNumber} needs review`;
      const exists = await prisma.notification.findFirst({ where: { userId: user.id, title, createdAt: { gte: new Date(Date.now() - 24 * 36e5) } } });
      if (!exists) {
        const notif = await prisma.notification.create({
          data: {
            userId: user.id,
            notificationType: "stale_pull_request",
            title,
            message: pr.title,
            priority: "medium"
          }
        });
        emitter.to(`user_${user.id}`).emit("notification.new", notif);
      }
    }
  }
}

async function detectRisks(repositoryId?: string) {
  const repositories = await prisma.repository.findMany({ where: repositoryId ? { id: repositoryId } : undefined });
  for (const repository of repositories) {
    const health = await analyticsService.calculateRepositoryHealth(repository.id);
    if (health.overallScore < 50) {
      const exists = await prisma.repositoryRisk.findFirst({ where: { repositoryId: repository.id, riskType: "repository_health", status: "open" } });
      if (!exists) {
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
}

async function generateAiSummaries(userId?: string) {
  const users = userId ? await prisma.user.findMany({ where: { id: userId } }) : await prisma.user.findMany({ where: { accountStatus: "ACTIVE" } });
  for (const user of users) {
    const summary = await aiService.weeklySummary(user.id);
    const exists = await prisma.aISummary.findFirst({ where: { userId: user.id, summaryType: "Weekly", generatedAt: { gte: new Date(Date.now() - 6 * 24 * 36e5) } } });
    if (!exists) {
      const summaryRecord = await prisma.aISummary.create({
        data: {
          userId: user.id,
          summaryType: "Weekly",
          content: summary.sections?.overallProductivity || "No summary available",
          modelName: summary.modelName || "unknown",
          confidence: summary.confidence || 0
        }
      });
      emitter.to(`user_${user.id}`).emit("ai.summary.completed", summaryRecord);
    }
  }
}

async function generateSnapshots() {
  const users = await prisma.user.findMany({ where: { accountStatus: "ACTIVE" } });
  for (const user of users) {
    const commits = await prisma.commit.count({ where: { authorId: user.id } });
    const prs = await prisma.pullRequest.count({ where: { authorId: user.id } });
    const reviews = await prisma.pullRequestReview.count({ where: { reviewerId: user.id } });

    const commitActivity = Math.min(100, commits * 7);
    const prScore = Math.min(100, prs * 25);
    const reviewScore = Math.min(100, reviews * 12);
    const consistency = commits > 8 ? 90 : commits > 0 ? 70 : 0;
    const score = Math.round(commitActivity * 0.35 + prScore * 0.25 + reviewScore * 0.2 + consistency * 0.2);

    await prisma.developerMetricSnapshot.create({
      data: {
        userId: user.id,
        productivityScore: score,
        commitActivity,
        prScore,
        reviewScore,
        consistency
      }
    });
  }

  const repositories = await prisma.repository.findMany();
  for (const repository of repositories) {
    const health = await analyticsService.calculateRepositoryHealth(repository.id);
    await prisma.repositoryMetricSnapshot.create({
      data: {
        repositoryId: repository.id,
        overallScore: health.overallScore,
        activityScore: health.activityScore,
        reviewScore: health.reviewScore,
        buildScore: health.buildScore,
        codeQualityScore: health.codeQualityScore,
        openIssues: await prisma.issue.count({ where: { repositoryId: repository.id, state: "open" } }),
        stalePrs: await prisma.pullRequest.count({ where: { repositoryId: repository.id, state: "OPEN", createdAtGitHub: { lt: new Date(Date.now() - 48 * 36e5) } } }),
        activeRisks: await prisma.repositoryRisk.count({ where: { repositoryId: repository.id, status: "open" } })
      }
    });
  }
}

async function generateReport(reportId: string) {
  const job = await prisma.exportJob.findUnique({ where: { id: reportId } });
  if (!job) return;

  const data = await analyticsService.getEngineeringKpis(job.userId);
  const reportsDir = path.join(process.cwd(), "reports");
  await fs.mkdir(reportsDir, { recursive: true });

  const fileName = `report_${reportId}.${job.format.toLowerCase()}`;
  const filePath = path.join(reportsDir, fileName);

  const fileLocation = `/reports/${fileName}`;

  if (job.format === "JSON") {
    await fs.writeFile(filePath, JSON.stringify(data, null, 2));
  } else if (job.format === "CSV") {
    const csvContent = Object.entries(data).map(([k, v]) => `${k},${v}`).join("\n");
    await fs.writeFile(filePath, `Metric,Value\n${csvContent}`);
  }

  await prisma.exportJob.update({
    where: { id: reportId },
    data: { status: "completed", fileLocation, completedAt: new Date() }
  });

  emitter.to(`user_${job.userId}`).emit("report.completed", { reportId, fileLocation });
}

async function handleJob(name: string, data: JobData) {
  switch (name) {
    case "github.sync": {
      const result = data.userId ? await githubSyncService.syncUser(data.userId) : null;
      if (data.userId) emitter.to(`user_${data.userId}`).emit("sync.completed", { type: "github.sync" });
      return result;
    }
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
      return data.reportId ? generateReport(data.reportId) : null;
    case "ml.snapshot.generate":
      return generateSnapshots();
    case "sessions.cleanup":
      return prisma.userSession.updateMany({ where: { expiresAt: { lt: new Date() }, isRevoked: false }, data: { isRevoked: true } });
    case "analytics.cache.refresh":
      return analyticsService.getEngineeringKpis(data.userId);
    default:
      throw new Error(`Unsupported job: ${name}`);
  }
}

let workerErrorLogged = false;

export function createWorker() {
  const connection = new Redis(env.REDIS_URL, { maxRetriesPerRequest: null });
  connection.on("error", (err) => {
    if (!workerErrorLogged) {
      logger.error(`Redis worker connection error: ${err.message} (subsequent connection errors will be silenced)`);
      workerErrorLogged = true;
    }
  });
  connection.on("connect", () => {
    workerErrorLogged = false;
    logger.info("Redis worker connected");
  });

  const worker = new Worker("devpulse", (job) => handleJob(job.name, job.data as JobData), {
    connection: connection as any,
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
