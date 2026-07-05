import { notFound } from "../../shared/errors.js";
import { prisma } from "../../shared/prisma.js";
import { aiService } from "../ai/ai.service.js";
import { analyticsService } from "../analytics/analytics.service.js";

export class ProfileService {
  async profile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        role: true,
        githubAccounts: true,
        developerProfile: true,
        achievements: { orderBy: { earnedAt: "desc" } },
        organization: true
      }
    });
    if (!user) throw notFound("User");
    const [commits, pullRequests, reviewsCompleted, repositories] = await Promise.all([
      prisma.commit.findMany({ where: { authorId: user.id }, orderBy: { commitDate: "desc" }, take: 50, include: { repository: true } }),
      prisma.pullRequest.findMany({ where: { authorId: user.id }, orderBy: { createdAtGitHub: "desc" } }),
      prisma.pullRequestReview.count({ where: { reviewerId: user.id } }),
      prisma.repository.findMany({ where: { OR: [{ ownerId: user.id }, { organizationId: user.organizationId ?? undefined }] }, orderBy: { fullName: "asc" } })
    ]);

    return {
      profile: {
        ...user,
        role: user.role.name,
        githubAccount: user.githubAccounts[0] ?? null,
        followers: null,
        following: null,
        publicRepositories: repositories.length,
        githubJoinDate: user.createdAt
      },
      analytics: {
        productivityScore: await analyticsService.calculateProductivityScore(user.id),
        totalCommits: commits.length,
        linesAdded: commits.reduce((sum, commit) => sum + commit.additions, 0),
        linesDeleted: commits.reduce((sum, commit) => sum + commit.deletions, 0),
        prsOpened: pullRequests.length,
        prsMerged: pullRequests.filter((pr) => pr.state === "MERGED").length,
        reviewsCompleted,
        averageMergeTime: `${Math.round(pullRequests.reduce((sum, pr) => sum + (pr.mergeTime ?? 0), 0) / (pullRequests.length || 1))}h`,
        averageReviewTime: `${Math.round(pullRequests.reduce((sum, pr) => sum + (pr.reviewTime ?? 0), 0) / (pullRequests.length || 1))}h`
      },
      achievements: user.achievements,
      heatmap: await analyticsService.getHeatmap(),
      activity: commits.slice(0, 8),
      aiSummary: await aiService.weeklySummary(user.id),
      repositories
    };
  }

  async achievements(userId: string) {
    return prisma.achievement.findMany({ where: { userId }, orderBy: { earnedAt: "desc" } });
  }

  async productivity(userId: string) {
    const trend = await analyticsService.getCommitTrend();
    const score = await analyticsService.calculateProductivityScore(userId);
    return {
      score,
      history: trend.map((point) => ({ ...point, score }))
    };
  }
}

export const profileService = new ProfileService();
