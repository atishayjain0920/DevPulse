import { prisma } from "../../shared/prisma.js";
import { analyticsService } from "../analytics/analytics.service.js";

export class DashboardService {
  async developerDashboard(userId: string) {
    const [commitSummary, prStats, workflowStats, repositories, repositoryCount, unreadNotifications, recentActivity, aiSummary] = await Promise.all([
      analyticsService.getCommitSummary(),
      analyticsService.getPullRequestStatistics(),
      analyticsService.getWorkflowStatistics(),
      prisma.repository.findMany({ orderBy: { syncedAt: "desc" }, take: 8 }),
      prisma.repository.count(),
      prisma.notification.count({ where: { userId, isRead: false, deletedAt: null } }),
      prisma.commit.findMany({ where: { authorId: userId }, orderBy: { commitDate: "desc" }, take: 6, include: { repository: true } }),
      prisma.aISummary.findFirst({ where: { userId }, orderBy: { generatedAt: "desc" } })
    ]);
    const languageRows = await prisma.repository.groupBy({ by: ["language"], _count: { language: true }, where: { language: { not: null } } });

    return {
      cards: {
        totalRepositories: repositoryCount,
        totalCommits: commitSummary.totalCommits,
        openPrs: prStats.open,
        mergedPrs: prStats.merged,
        failedBuilds: workflowStats.failed,
        successfulBuilds: workflowStats.successful,
        buildSuccessRate: workflowStats.buildSuccessRate,
        deploymentFrequency: workflowStats.deploymentFrequency,
        repositoryHealth: (await analyticsService.getEngineeringKpis(userId)).repositoryHealth,
        productivityScore: await analyticsService.calculateProductivityScore(userId),
        notifications: unreadNotifications,
        pendingReviews: prStats.pendingReviews
      },
      charts: {
        commitTrend: await analyticsService.getCommitTrend(),
        heatmap: await analyticsService.getHeatmap(),
        churn: await analyticsService.getChurn(),
        languageDistribution: languageRows.map((row) => ({ name: row.language, value: row._count.language }))
      },
      aiInsight: aiSummary?.content ?? null,
      recentActivity,
      recentRepositories: repositories,
      dataFreshness: {
        lastUpdated: new Date().toISOString(),
        dataSource: "PostgreSQL via Prisma and GitHub sync",
        refreshStatus: "fresh"
      }
    };
  }

  async executiveDashboard(userId?: string) {
    const [kpis, users, repositories, highRiskRepositories, buildTrends, aiSummary] = await Promise.all([
      analyticsService.getEngineeringKpis(userId),
      prisma.user.findMany({ include: { role: true, developerProfile: true }, orderBy: { displayName: "asc" } }),
      prisma.repository.findMany({ include: { risks: { where: { status: "open" } } }, orderBy: { fullName: "asc" } }),
      prisma.repositoryRisk.findMany({ where: { status: "open", severity: { in: ["HIGH", "CRITICAL"] } }, include: { repository: true } }),
      prisma.workflowRun.findMany({ orderBy: { startedAt: "desc" }, take: 20, include: { workflow: { include: { repository: true } } } }),
      userId ? prisma.aISummary.findFirst({ where: { userId, summaryType: "Executive" }, orderBy: { generatedAt: "desc" } }) : null
    ]);
    return {
      kpis,
      teamProductivity: await Promise.all(users.map(async (user) => ({
        userId: user.id,
        name: user.displayName,
        role: user.role.name,
        productivityScore: user.developerProfile?.productivityScore ?? await analyticsService.calculateProductivityScore(user.id)
      }))),
      repositoryHealth: await Promise.all(repositories.map(async (repo) => ({ ...repo, health: await analyticsService.calculateRepositoryHealth(repo.id) }))),
      highRiskRepositories,
      buildTrends,
      aiExecutiveSummary: aiSummary?.content ?? null
    };
  }

  async repositoryDashboard(repositoryId: string) {
    const repository = await prisma.repository.findFirst({
      where: { OR: [{ id: repositoryId }, { githubRepositoryId: repositoryId }, { fullName: repositoryId }] }
    });
    const id = repository?.id ?? repositoryId;
    const [commits, pullRequests, workflows, risks, contributors, aiSummary] = await Promise.all([
      prisma.commit.findMany({ where: { repositoryId: id }, orderBy: { commitDate: "desc" }, take: 10, include: { author: true } }),
      prisma.pullRequest.findMany({ where: { repositoryId: id }, orderBy: { createdAtGitHub: "desc" }, include: { author: true, reviews: true } }),
      prisma.workflowRun.findMany({ where: { workflow: { repositoryId: id } }, orderBy: { startedAt: "desc" }, include: { workflow: true } }),
      prisma.repositoryRisk.findMany({ where: { repositoryId: id, status: "open" }, orderBy: { detectedAt: "desc" } }),
      prisma.contributor.findMany({ where: { repositoryId: id }, orderBy: { totalCommits: "desc" } }),
      prisma.aISummary.findFirst({ where: { summaryType: `Repository:${id}` }, orderBy: { generatedAt: "desc" } })
    ]);
    return {
      repository,
      overview: {
        commits: commits.length,
        pullRequests: pullRequests.length,
        workflows: workflows.length,
        risks
      },
      health: await analyticsService.calculateRepositoryHealth(id),
      contributors,
      commits,
      pullRequests,
      workflows,
      aiSummary: aiSummary?.content ?? null
    };
  }

  async teamDashboard(userId?: string) {
    const [kpis, users, repositories, prStats] = await Promise.all([
      analyticsService.getEngineeringKpis(userId),
      prisma.user.findMany({ include: { role: true, developerProfile: true }, orderBy: { displayName: "asc" } }),
      prisma.repository.findMany({ include: { pullRequests: true }, orderBy: { fullName: "asc" } }),
      analyticsService.getPullRequestStatistics()
    ]);
    return {
      kpis,
      developers: await Promise.all(users.map(async (user) => ({
        ...user,
        role: user.role.name,
        productivityScore: user.developerProfile?.productivityScore ?? await analyticsService.calculateProductivityScore(user.id)
      }))),
      reviewPerformance: prStats,
      repositoryComparison: await Promise.all(repositories.map(async (repo) => ({
        repository: repo.name,
        health: (await analyticsService.calculateRepositoryHealth(repo.id)).overallScore,
        openPrs: repo.pullRequests.filter((pr) => pr.state === "OPEN").length
      })))
    };
  }
}

export const dashboardService = new DashboardService();
