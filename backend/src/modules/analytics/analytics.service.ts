import { prisma } from "../../shared/prisma.js";

const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function pct(part: number, total: number): number {
  return total ? Math.round((part / total) * 100) : 0;
}

function avg(values: Array<number | null | undefined>): number {
  const usable = values.filter((value): value is number => typeof value === "number");
  return usable.length ? Math.round(usable.reduce((sum, value) => sum + value, 0) / usable.length) : 0;
}

function hoursBetween(from?: Date | null, to?: Date | null): number | null {
  if (!from || !to) return null;
  return Math.max(0, Math.round((to.getTime() - from.getTime()) / 36e5));
}

export interface AnalyticsFilter {
  repositoryId?: string;
  developerId?: string;
  organizationId?: string;
  from?: Date;
  to?: Date;
  branch?: string;
  workflow?: string;
}

function buildCommitWhere(filter?: AnalyticsFilter) {
  const where: any = {};
  if (filter?.repositoryId) where.repositoryId = filter.repositoryId;
  if (filter?.developerId) where.authorId = filter.developerId;
  if (filter?.organizationId) where.repository = { organizationId: filter.organizationId };
  if (filter?.from || filter?.to) {
    where.commitDate = {};
    if (filter.from) where.commitDate.gte = new Date(filter.from);
    if (filter.to) where.commitDate.lte = new Date(filter.to);
  }
  return where;
}

function buildPRWhere(filter?: AnalyticsFilter) {
  const where: any = {};
  if (filter?.repositoryId) where.repositoryId = filter.repositoryId;
  if (filter?.developerId) where.authorId = filter.developerId;
  if (filter?.organizationId) where.repository = { organizationId: filter.organizationId };
  if (filter?.from || filter?.to) {
    where.createdAtGitHub = {};
    if (filter.from) where.createdAtGitHub.gte = new Date(filter.from);
    if (filter.to) where.createdAtGitHub.lte = new Date(filter.to);
  }
  return where;
}

export class AnalyticsService {
  async getCommitSummary(filter?: AnalyticsFilter) {
    const commits = await prisma.commit.findMany({
      where: buildCommitWhere(filter),
      select: { additions: true, deletions: true, totalChanges: true, commitDate: true }
    });
    const additions = commits.reduce((sum, commit) => sum + commit.additions, 0);
    const deletions = commits.reduce((sum, commit) => sum + commit.deletions, 0);
    const buckets = new Map<string, number>();
    commits.forEach((commit) => {
      const day = dayNames[commit.commitDate.getUTCDay()];
      buckets.set(day, (buckets.get(day) ?? 0) + 1);
    });
    const mostActiveDay = Array.from(buckets.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
    const hourBuckets = new Map<number, number>();
    commits.forEach((commit) => {
      const hour = commit.commitDate.getUTCHours();
      hourBuckets.set(hour, (hourBuckets.get(hour) ?? 0) + 1);
    });
    const mostActiveHour = Array.from(hourBuckets.entries()).sort((a, b) => b[1] - a[1])[0]?.[0];

    return {
      totalCommits: commits.length,
      additions,
      deletions,
      codeChurn: additions + deletions,
      averageCommitSize: avg(commits.map((commit) => commit.totalChanges)),
      mostActiveDay,
      mostActiveHour: mostActiveHour === undefined ? null : `${String(mostActiveHour).padStart(2, "0")}:00`,
      longestCommitStreak: this.longestStreak(commits.map((commit) => commit.commitDate))
    };
  }

  async getCommitTrend(filter?: AnalyticsFilter) {
    const commits = await prisma.commit.findMany({
      where: buildCommitWhere(filter),
      select: { commitDate: true },
      orderBy: { commitDate: "asc" }
    });
    const buckets = new Map<string, number>();
    commits.forEach((commit) => {
      const key = commit.commitDate.toISOString().slice(0, 10);
      buckets.set(key, (buckets.get(key) ?? 0) + 1);
    });
    return Array.from(buckets.entries()).map(([date, count]) => ({ date, commits: count }));
  }

  async getHeatmap(filter?: AnalyticsFilter) {
    const trend = await this.getCommitTrend(filter);
    return trend.map((point) => ({
      date: point.date,
      count: point.commits,
      level: Math.min(4, point.commits)
    }));
  }

  async getChurn(filter?: AnalyticsFilter) {
    const whereRepo: any = {};
    if (filter?.repositoryId) whereRepo.id = filter.repositoryId;
    if (filter?.organizationId) whereRepo.organizationId = filter.organizationId;

    const repositories = await prisma.repository.findMany({
      where: whereRepo,
      select: {
        id: true,
        name: true,
        commits: {
          where: buildCommitWhere(filter),
          select: { additions: true, deletions: true }
        }
      },
      orderBy: { fullName: "asc" }
    });
    return repositories.map((repository) => ({
      repositoryId: repository.id,
      repository: repository.name,
      additions: repository.commits.reduce((sum, commit) => sum + commit.additions, 0),
      deletions: repository.commits.reduce((sum, commit) => sum + commit.deletions, 0)
    }));
  }

  async getPullRequestStatistics(filter?: AnalyticsFilter) {
    const pullRequests = await prisma.pullRequest.findMany({
      where: buildPRWhere(filter),
      include: { reviews: true }
    });
    const open = pullRequests.filter((pr) => pr.state === "OPEN").length;
    const merged = pullRequests.filter((pr) => pr.state === "MERGED").length;
    const closed = pullRequests.filter((pr) => pr.state === "CLOSED").length;
    const draft = pullRequests.filter((pr) => pr.state === "DRAFT").length;
    const reviewTimes = pullRequests.map((pr) => pr.reviewTime ?? avg(pr.reviews.map((review) => review.reviewDuration)));
    const mergeTimes = pullRequests.map((pr) => pr.mergeTime ?? hoursBetween(pr.createdAtGitHub, pr.mergedAt));

    return {
      open,
      merged,
      closed,
      draft,
      rejected: closed,
      approvalRate: pct(pullRequests.filter((pr) => pr.reviews.some((review) => review.reviewState.toLowerCase() === "approved")).length, pullRequests.length),
      mergeSuccessRate: pct(merged, pullRequests.length),
      averageReviewTime: avg(reviewTimes),
      averageMergeTime: avg(mergeTimes),
      pendingReviews: open,
      stalePrs: pullRequests.filter((pr) => pr.state === "OPEN" && hoursBetween(pr.createdAtGitHub, new Date())! > 48).length
    };
  }

  async getWorkflowStatistics() {
    const runs = await prisma.workflowRun.findMany({ include: { deployments: true } });
    const successful = runs.filter((run) => run.conclusion === "success").length;
    const failed = runs.filter((run) => run.conclusion === "failure").length;
    const cancelled = runs.filter((run) => run.conclusion === "cancelled").length;
    const deployments = runs.flatMap((run) => run.deployments);

    return {
      totalRuns: runs.length,
      successful,
      failed,
      cancelled,
      buildSuccessRate: pct(successful, runs.length),
      buildFailureRate: pct(failed, runs.length),
      averageBuildDuration: avg(runs.map((run) => run.duration)),
      longestBuild: runs.length ? Math.max(...runs.map((run) => run.duration ?? 0)) : 0,
      deploymentFrequency: deployments.length,
      retryRate: pct(runs.filter((run) => run.status === "queued" || run.status === "in_progress").length, runs.length)
    };
  }

  async calculateProductivityScore(userId: string) {
    const [commits, prs, reviews, profile] = await Promise.all([
      prisma.commit.count({ where: { authorId: userId } }),
      prisma.pullRequest.count({ where: { authorId: userId } }),
      prisma.pullRequestReview.count({ where: { reviewerId: userId } }),
      prisma.developerProfile.findUnique({ where: { userId } })
    ]);
    if (profile?.productivityScore && profile.lastCalculated > new Date(Date.now() - 24 * 36e5)) return profile.productivityScore;

    const commitActivity = Math.min(100, commits * 7);
    const prScore = Math.min(100, prs * 25);
    const reviewScore = Math.min(100, reviews * 12);
    const consistency = commits > 8 ? 90 : commits > 0 ? 70 : 0;
    const score = Math.round(commitActivity * 0.35 + prScore * 0.25 + reviewScore * 0.2 + consistency * 0.2);

    await prisma.developerProfile.upsert({
      where: { userId },
      create: { userId, productivityScore: score, totalCommits: commits, totalPRs: prs, totalReviews: reviews, lastCalculated: new Date() },
      update: { productivityScore: score, totalCommits: commits, totalPRs: prs, totalReviews: reviews, lastCalculated: new Date() }
    });

    return score;
  }

  async calculateRepositoryHealth(repositoryId: string) {
    const [runs, pullRequests, risks, commitCount, stored] = await Promise.all([
      prisma.workflowRun.findMany({ where: { workflow: { repositoryId } } }),
      prisma.pullRequest.findMany({ where: { repositoryId } }),
      prisma.repositoryRisk.findMany({ where: { repositoryId, status: "open" } }),
      prisma.commit.count({ where: { repositoryId } }),
      prisma.repositoryHealth.findFirst({ where: { repositoryId }, orderBy: { calculatedAt: "desc" } })
    ]);
    if (stored && stored.calculatedAt > new Date(Date.now() - 24 * 36e5)) {
      return { ...stored, calculatedAt: stored.calculatedAt.toISOString() };
    }
    if (!runs.length && !pullRequests.length && !risks.length && !commitCount && stored) return { ...stored, calculatedAt: stored.calculatedAt.toISOString() };

    const buildSuccess = runs.length ? pct(runs.filter((run) => run.conclusion === "success").length, runs.length) : 0;
    const openPrBacklog = pullRequests.filter((pr) => pr.state === "OPEN").length;
    const riskPenalty = risks.length * 9;
    const commitActivity = Math.min(100, commitCount * 4);
    const reviewScore = Math.max(0, 100 - openPrBacklog * 18);
    const codeQualityScore = Math.max(0, 100 - riskPenalty);
    const score = Math.max(0, Math.min(100, Math.round(buildSuccess * 0.3 + commitActivity * 0.25 + reviewScore * 0.25 + codeQualityScore * 0.2)));

    const healthData = {
      repositoryId,
      overallScore: score,
      activityScore: commitActivity,
      reviewScore,
      buildScore: buildSuccess,
      deploymentScore: runs.length ? buildSuccess : 0,
      codeQualityScore,
      riskLevel: score >= 90 ? "Excellent" : score >= 75 ? "Healthy" : score >= 50 ? "Needs Attention" : "Critical"
    };

    const saved = await prisma.repositoryHealth.create({ data: healthData });

    return { ...saved, calculatedAt: saved.calculatedAt.toISOString() };
  }

  async getEngineeringKpis(userId?: string) {
    const [prs, workflows, repositoryCount, users, openRisks, repositories] = await Promise.all([
      this.getPullRequestStatistics(),
      this.getWorkflowStatistics(),
      prisma.repository.count(),
      prisma.user.count({ where: { accountStatus: "ACTIVE" } }),
      prisma.repositoryRisk.count({ where: { status: "open" } }),
      prisma.repository.findMany({ select: { id: true } })
    ]);
    const healthScores = await Promise.all(repositories.map((repo) => this.calculateRepositoryHealth(repo.id)));
    const productivityScore = userId ? await this.calculateProductivityScore(userId) : 0;

    return {
      leadTime: `${prs.averageMergeTime}h`,
      reviewTime: `${prs.averageReviewTime}h`,
      mergeTime: `${prs.averageMergeTime}h`,
      deploymentFrequency: `${workflows.deploymentFrequency}/period`,
      buildSuccessRate: `${workflows.buildSuccessRate}%`,
      activeContributors: users,
      repositoryCount,
      productivityScore,
      repositoryHealth: avg(healthScores.map((health) => health.overallScore)),
      aiRiskCount: openRisks
    };
  }

  private longestStreak(dates: Date[]): number {
    const uniqueDays = Array.from(new Set(dates.map((date) => date.toISOString().slice(0, 10)))).sort();
    let longest = 0;
    let current = 0;
    let previous: Date | null = null;
    uniqueDays.forEach((day) => {
      const date = new Date(`${day}T00:00:00.000Z`);
      const consecutive = previous ? (date.getTime() - previous.getTime()) / 864e5 === 1 : true;
      current = consecutive ? current + 1 : 1;
      longest = Math.max(longest, current);
      previous = date;
    });
    return longest;
  }
}

export const analyticsService = new AnalyticsService();
