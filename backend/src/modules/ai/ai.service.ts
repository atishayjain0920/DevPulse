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

    if (stored && stored.content && stored.content.startsWith("{")) {
      try {
        return {
          summaryType: "Weekly",
          generatedAt: stored.generatedAt.toISOString(),
          modelName: stored.modelName,
          confidence: stored.confidence,
          disclaimer,
          sections: JSON.parse(stored.content)
        };
      } catch (e) {
        logger.error({ error: e }, "Failed to parse stored weekly summary");
      }
    }

    const context = await this.buildContext(userId);
    const prompt = `Based on the following DevPulse context, generate a JSON weekly summary for the user's engineering team with these exact keys: overallProductivity, commitHighlights, prPerformance, buildHealth, repositoryHealth, topContributors, risks, achievements, recommendations. The values must be strings or arrays of strings. Return ONLY valid JSON, no markdown formatting. Context: ${JSON.stringify(context)}`;
    
    let contentStr = "";
    try {
      const response = await this.askProvider(prompt, context);
      contentStr = response.replace(/```json/gi, '').replace(/```/g, '').trim();
      JSON.parse(contentStr); // validate
    } catch (e) {
      logger.error({ error: e }, "Failed to generate weekly summary via Gemini");
      contentStr = JSON.stringify({ overallProductivity: "Summary generation failed or insufficient data." });
    }

    if (userId) {
      await prisma.aISummary.create({
        data: { userId, summaryType: "Weekly", content: contentStr, modelName: env.AI_MODEL, confidence: 0.85 }
      });
    }

    return {
      summaryType: "Weekly",
      generatedAt: new Date().toISOString(),
      modelName: env.AI_MODEL,
      confidence: 0.85,
      disclaimer,
      sections: JSON.parse(contentStr)
    };
  }

  async executiveSummary(userId?: string) {
    const stored = userId
      ? await prisma.aISummary.findFirst({ where: { userId, summaryType: "Executive" }, orderBy: { generatedAt: "desc" } })
      : null;
    
    if (stored) {
      return {
        summaryType: "Executive",
        generatedAt: stored.generatedAt.toISOString(),
        disclaimer,
        content: stored.content
      };
    }

    const context = await this.buildContext(userId);
    const prompt = `Based on the following DevPulse context, write a 2-3 paragraph executive summary of the engineering team's current status, focusing on KPIs, delivery bottlenecks, and major risks. Return ONLY the summary text. Context: ${JSON.stringify(context)}`;
    
    let contentStr = "Insufficient data to generate executive summary.";
    try {
      contentStr = await this.askProvider(prompt, context);
    } catch (e) {
      logger.error({ error: e }, "Failed to generate executive summary via Gemini");
    }

    if (userId) {
      await prisma.aISummary.create({
        data: { userId, summaryType: "Executive", content: contentStr, modelName: env.AI_MODEL, confidence: 0.85 }
      });
    }

    return {
      summaryType: "Executive",
      generatedAt: new Date().toISOString(),
      disclaimer,
      content: contentStr
    };
  }

  async repositorySummary(repositoryId: string) {
    const repository = await prisma.repository.findFirst({ where: { OR: [{ id: repositoryId }, { githubRepositoryId: repositoryId }, { fullName: repositoryId }] } });
    const health = await analyticsService.calculateRepositoryHealth(repository?.id ?? repositoryId);
    const stored = repository
      ? await prisma.aISummary.findFirst({ where: { summaryType: `Repository:${repository.id}` }, orderBy: { generatedAt: "desc" } })
      : null;
    
    if (stored) {
      return {
        repositoryId: repository?.id ?? repositoryId,
        title: `${repository?.name ?? "Repository"} analytics summary`,
        health,
        disclaimer,
        content: stored.content
      };
    }

    const context = await this.buildContext(); // We can pass a filtered context later if needed
    const repoData = context.repositories.find(r => r.id === repository?.id);
    const prompt = `Based on the following repository data and overall context, write a concise 1-paragraph technical summary of the repository's health, recent activity, and risks. Return ONLY the summary text. Repository Data: ${JSON.stringify(repoData)}`;
    
    let contentStr = `${repository?.fullName ?? "This repository"} has a ${health.riskLevel.toLowerCase()} health rating with a score of ${health.overallScore}/100.`;
    try {
      contentStr = await this.askProvider(prompt, context);
    } catch (e) {
      logger.error({ error: e }, "Failed to generate repository summary via Gemini");
    }

    if (repository) {
      await prisma.aISummary.create({
        data: { userId: "system", summaryType: `Repository:${repository.id}`, content: contentStr, modelName: env.AI_MODEL, confidence: 0.85 }
      });
    }

    return {
      repositoryId: repository?.id ?? repositoryId,
      title: `${repository?.name ?? "Repository"} analytics summary`,
      health,
      disclaimer,
      content: contentStr
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
