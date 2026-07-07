import { GoogleGenAI } from "@google/genai";
import { env } from "../../config/env.js";
import { logger } from "../../config/logger.js";
import { AppError } from "../../shared/errors.js";
import { prisma } from "../../shared/prisma.js";
import { analyticsService } from "../analytics/analytics.service.js";

const disclaimer = "AI-generated from available DevPulse analytics. It may not capture every engineering nuance.";

export class AiService {
  async weeklySummary(userId?: string) {
    const stored = userId
      ? await prisma.aISummary.findFirst({ where: { userId, summaryType: "Weekly" }, orderBy: { generatedAt: "desc" } })
      : null;
    const kpis = await analyticsService.getEngineeringKpis(userId);
    const [risks, users] = await Promise.all([
      prisma.repositoryRisk.findMany({ where: { status: "open" }, orderBy: { detectedAt: "desc" }, take: 10 }),
      prisma.user.findMany({ orderBy: { displayName: "asc" }, take: 10 })
    ]);

    return {
      summaryType: "Weekly",
      generatedAt: stored?.generatedAt?.toISOString() ?? new Date().toISOString(),
      modelName: stored?.modelName ?? env.AI_MODEL,
      confidence: stored?.confidence ?? 0,
      disclaimer,
      sections: {
        overallProductivity: stored?.content ?? `Team productivity is ${kpis.productivityScore}/100 with ${kpis.activeContributors} active contributors.`,
        commitHighlights: `The current analytics window contains ${kpis.repositoryCount} synced repositories.`,
        prPerformance: `Average review time is ${kpis.reviewTime}; stale PR count is reflected in pull request analytics.`,
        buildHealth: `Build success rate is ${kpis.buildSuccessRate}.`,
        repositoryHealth: `Average repository health is ${kpis.repositoryHealth}/100.`,
        topContributors: users.map((user) => user.displayName).join(", "),
        risks: risks.map((risk) => risk.title),
        achievements: [],
        recommendations: (await this.recommendations()).map((recommendation) => recommendation.title)
      }
    };
  }

  async executiveSummary(userId?: string) {
    const stored = userId
      ? await prisma.aISummary.findFirst({ where: { userId, summaryType: "Executive" }, orderBy: { generatedAt: "desc" } })
      : null;
    const kpis = await analyticsService.getEngineeringKpis(userId);
    return {
      summaryType: "Executive",
      generatedAt: stored?.generatedAt?.toISOString() ?? new Date().toISOString(),
      disclaimer,
      content: stored?.content ?? `Engineering delivery is currently measured at ${kpis.repositoryHealth}/100 repository health with ${kpis.buildSuccessRate} build success.`
    };
  }

  async repositorySummary(repositoryId: string) {
    const repository = await prisma.repository.findFirst({ where: { OR: [{ id: repositoryId }, { githubRepositoryId: repositoryId }, { fullName: repositoryId }] } });
    const health = await analyticsService.calculateRepositoryHealth(repository?.id ?? repositoryId);
    const stored = repository
      ? await prisma.aISummary.findFirst({ where: { summaryType: `Repository:${repository.id}` }, orderBy: { generatedAt: "desc" } })
      : null;
    return {
      repositoryId: repository?.id ?? repositoryId,
      title: `${repository?.name ?? "Repository"} analytics summary`,
      health,
      disclaimer,
      content: stored?.content ?? `${repository?.fullName ?? "This repository"} has a ${health.riskLevel.toLowerCase()} health rating with a score of ${health.overallScore}/100.`
    };
  }

  async recommendations() {
    const [risks, stalePrs, failedRuns] = await Promise.all([
      prisma.repositoryRisk.findMany({ where: { status: "open" }, include: { repository: true }, orderBy: [{ severity: "desc" }, { detectedAt: "desc" }], take: 5 }),
      prisma.pullRequest.findMany({ where: { state: "OPEN", createdAtGitHub: { lt: new Date(Date.now() - 48 * 36e5) } }, include: { repository: true }, take: 5 }),
      prisma.workflowRun.findMany({ where: { conclusion: "failure" }, include: { workflow: { include: { repository: true } } }, orderBy: { startedAt: "desc" }, take: 5 })
    ]);
    return [
      ...risks.map((risk) => ({ id: risk.id, severity: risk.severity.toLowerCase(), impact: risk.riskType, title: risk.title, action: risk.recommendation })),
      ...stalePrs.map((pr) => ({ id: pr.id, severity: "medium", impact: "Improves merge lead time", title: `Review ${pr.repository.fullName} PR #${pr.githubPRNumber}`, action: "Assign a reviewer or split the change set." })),
      ...failedRuns.map((run) => ({ id: run.id, severity: "high", impact: "Improves delivery reliability", title: `Investigate ${run.workflow.repository.fullName} workflow failure`, action: "Inspect the failed run and queue a fix-forward sync." }))
    ];
  }

  async risks() {
    return prisma.repositoryRisk.findMany({ where: { status: "open" }, include: { repository: true }, orderBy: { detectedAt: "desc" } });
  }

  async chat(question: string, userId?: string) {
    const normalized = question.toLowerCase();
    if (normalized.includes("active")) {
      const repos = await prisma.repository.findMany({ include: { _count: { select: { commits: true } } }, orderBy: { commits: { _count: "desc" } }, take: 1 });
      return { answer: repos[0] ? `${repos[0].fullName} is currently the most active repository by commit volume.` : "No repository activity has been synced yet.", links: repos[0] ? [`/repositories/${repos[0].id}`] : [], disclaimer };
    }
    if (normalized.includes("failed build") || normalized.includes("build failure")) {
      const run = await prisma.workflowRun.findFirst({ where: { conclusion: "failure" }, include: { workflow: { include: { repository: true } } }, orderBy: { startedAt: "desc" } });
      return { answer: run ? `${run.workflow.repository.fullName} has the most recent failed workflow run.` : "No failed workflow runs are present in the database.", links: run ? [`/repositories/${run.workflow.repositoryId}`] : [], disclaimer };
    }
    if (normalized.includes("stale pull") || normalized.includes("stale pr")) {
      const prs = await prisma.pullRequest.count({ where: { state: "OPEN", createdAtGitHub: { lt: new Date(Date.now() - 48 * 36e5) } } });
      return { answer: `${prs} open pull request(s) are older than 48 hours.`, links: ["/pull-requests?status=stale"], disclaimer };
    }
    if (normalized.includes("risk")) {
      const risks = await this.risks();
      return { answer: `${risks.length} open repository risk(s) are currently tracked.`, links: ["/repositories"], disclaimer };
    }
    if (normalized.includes("summarize")) {
      const summary = await this.weeklySummary(userId);
      return { answer: summary.sections.overallProductivity, links: ["/ai"], disclaimer };
    }

    if (!(await this.hasSyncedProjectData())) {
      return { answer: "I could not find sufficient synced project data to answer that yet.", links: [], disclaimer };
    }
    if (!env.AI_API_KEY) {
      throw new AppError(503, "AI_PROVIDER_NOT_CONFIGURED", "AI API key is not configured.");
    }

    const context = await this.buildContext(userId);
    logger.info({
      repositories: context.repositories.length,
      commits: context.commits.length,
      prs: context.pullRequests.length,
      risks: context.risks.length,
      workflows: context.workflowRuns.length
    }, "AI Context");
    const providerAnswer = await this.askProvider(question, context);
    logger.info({
      answer: providerAnswer
    }, "Gemini Response");
    await this.storeConversation(question, providerAnswer, userId);

    return {
      answer: providerAnswer,
      links: [],
      disclaimer
    };
  }

  private async hasSyncedProjectData(): Promise<boolean> {
    const [repositories, commits, pullRequests] = await Promise.all([
      prisma.repository.count(),
      prisma.commit.count(),
      prisma.pullRequest.count()
    ]);
    return repositories > 0 || commits > 0 || pullRequests > 0;
  }

  private async buildContext(userId?: string) {
    const [repositories, commits, pullRequests, risks, workflowRuns, contributors, kpis, health] = await Promise.all([
      prisma.repository.findMany({ orderBy: { syncedAt: "desc" }, take: 20 }),
      prisma.commit.findMany({ orderBy: { commitDate: "desc" }, take: 30, include: { repository: true } }),
      prisma.pullRequest.findMany({ orderBy: { createdAtGitHub: "desc" }, take: 30, include: { repository: true, reviews: true } }),
      prisma.repositoryRisk.findMany({ where: { status: "open" }, orderBy: { detectedAt: "desc" }, take: 20, include: { repository: true } }),
      prisma.workflowRun.findMany({ orderBy: { startedAt: "desc" }, take: 20, include: { workflow: { include: { repository: true } } } }),
      prisma.contributor.findMany({ orderBy: { totalCommits: "desc" }, take: 20, include: { repository: true } }),
      analyticsService.getEngineeringKpis(userId),
      prisma.repositoryHealth.findMany({ orderBy: { calculatedAt: "desc" }, take: 20, include: { repository: true } })
    ]);

    return {
      provider: env.AI_PROVIDER,
      model: env.AI_MODEL,
      kpis,
      repositories: repositories.map((repo) => ({
        id: repo.id,
        fullName: repo.fullName,
        language: repo.language,
        stars: repo.stars,
        forks: repo.forks,
        openIssues: repo.openIssues,
        lastPush: repo.lastPush,
        topics: repo.topics
      })),
      commits: commits.map((commit) => ({
        repository: commit.repository.fullName,
        message: commit.message,
        additions: commit.additions,
        deletions: commit.deletions,
        commitDate: commit.commitDate
      })),
      pullRequests: pullRequests.map((pr) => ({
        repository: pr.repository.fullName,
        title: pr.title,
        state: pr.state,
        comments: pr.comments,
        reviewCount: pr.reviews.length,
        createdAtGitHub: pr.createdAtGitHub,
        mergedAt: pr.mergedAt
      })),
      risks: risks.map((risk) => ({
        repository: risk.repository.fullName,
        severity: risk.severity,
        title: risk.title,
        recommendation: risk.recommendation
      })),
      workflowRuns: workflowRuns.map((run) => ({
        repository: run.workflow.repository.fullName,
        workflow: run.workflow.name,
        status: run.status,
        conclusion: run.conclusion,
        startedAt: run.startedAt
      })),
      contributors: contributors.map((contributor) => ({
        repository: contributor.repository.fullName,
        login: contributor.login,
        totalCommits: contributor.totalCommits,
        codeChurn: contributor.codeChurn
      })),
      repositoryHealth: health.map((entry) => ({
        repository: entry.repository.fullName,
        overallScore: entry.overallScore,
        riskLevel: entry.riskLevel,
        calculatedAt: entry.calculatedAt
      }))
    };
  }

  private async askProvider(
    question: string,
    context: Awaited<ReturnType<AiService["buildContext"]>>
  ): Promise<string> {
    try {
      const ai = new GoogleGenAI({
        apiKey: env.AI_API_KEY!
      });

      const prompt = `
  You are DevPulse AI.

  Use ONLY the supplied DevPulse data.

  If information is unavailable, say so.

  Context:

  ${JSON.stringify(context, null, 2)}

  Question:

  ${question}
  `;

      const response = await ai.models.generateContent({
        model: env.AI_MODEL,
        contents: prompt
      });

      return response.text ?? "No response generated.";

    } catch (error) {
      logger.error({ error }, "Gemini request failed");

      throw new AppError(
        502,
        "AI_PROVIDER_FAILED",
        "Gemini request failed."
      );
    }
  }

  private async storeConversation(question: string, answer: string, userId?: string) {
    if (!userId) return;
    const conversation = await prisma.aIConversation.create({
      data: {
        userId,
        title: question.slice(0, 80),
        messages: {
          create: [
            { sender: "user", content: question },
            { sender: "assistant", content: answer, metadata: { provider: env.AI_PROVIDER, model: env.AI_MODEL } }
          ]
        }
      }
    });
    await prisma.aISummary.create({
      data: {
        userId,
        summaryType: "Chat",
        content: answer,
        modelName: env.AI_MODEL,
        confidence: 0.75
      }
    });
    return conversation;
  }
}

export const aiService = new AiService();
