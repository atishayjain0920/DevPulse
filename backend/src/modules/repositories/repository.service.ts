import { notFound } from "../../shared/errors.js";
import { prisma } from "../../shared/prisma.js";
import { analyticsService } from "../analytics/analytics.service.js";
import { githubSyncService } from "../sync/githubSync.service.js";

export class RepositoryService {
  async list() {
    const repositories = await prisma.repository.findMany({
      include: { risks: { where: { status: "open" } } },
      orderBy: { fullName: "asc" }
    });
    return Promise.all(
      repositories.map(async (repository) => ({
        ...repository,
        health: await analyticsService.calculateRepositoryHealth(repository.id),
        risks: repository.risks.length
      }))
    );
  }

  async details(id: string) {
    const repository = await prisma.repository.findFirst({
      where: { OR: [{ id }, { githubRepositoryId: id }, { fullName: id }] },
      include: {
        organization: true,
        health: { orderBy: { calculatedAt: "desc" }, take: 1 },
        risks: { where: { status: "open" }, orderBy: { detectedAt: "desc" } }
      }
    });
    if (!repository) throw notFound("Repository");
    return repository;
  }

  async contributors(id: string) {
    const repository = await this.details(id);
    const contributors = await prisma.contributor.findMany({
      where: { repositoryId: repository.id },
      orderBy: { totalCommits: "desc" }
    });
    const users = await prisma.user.findMany({
      where: { id: { in: contributors.map((contributor) => contributor.userId).filter((value): value is string => Boolean(value)) } }
    });
    const userById = new Map(users.map((user) => [user.id, user]));
    return contributors.map((contributor) => {
      const user = contributor.userId ? userById.get(contributor.userId) : null;
      return {
        userId: contributor.userId,
        displayName: user?.displayName ?? user?.username ?? "Unknown contributor",
        username: user?.username,
        totalCommits: contributor.totalCommits,
        codeChurn: contributor.codeChurn,
        totalAdditions: contributor.totalAdditions,
        totalDeletions: contributor.totalDeletions,
        firstContribution: contributor.firstContribution,
        lastContribution: contributor.lastContribution
      };
    });
  }

  async branches(id: string) {
    const repository = await this.details(id);
    return prisma.branch.findMany({ where: { repositoryId: repository.id }, orderBy: [{ isDefault: "desc" }, { githubBranchName: "asc" }] });
  }

  async sync(id: string) {
    const repository = await this.details(id);
    const job = await prisma.syncJob.create({
      data: {
        repositoryId: repository.id,
        jobType: "repository_sync",
        status: "queued",
        payload: { source: "manual" }
      }
    });
    const synced = await githubSyncService.syncRepository(repository.id);
    await prisma.syncJob.update({
      where: { id: job.id },
      data: { status: synced ? "completed" : "failed", completedAt: new Date(), lastError: synced ? null : "No GitHub account is available for repository sync." }
    });
    return {
      repositoryId: repository.id,
      repository: repository.fullName,
      syncStatus: synced ? "completed" : "failed",
      syncMethod: "manual",
      jobId: job.id,
      message: synced ? "GitHub synchronization completed." : "GitHub synchronization could not run because no GitHub account is connected.",
      queuedAt: job.scheduledAt.toISOString()
    };
  }
}

export const repositoryService = new RepositoryService();
