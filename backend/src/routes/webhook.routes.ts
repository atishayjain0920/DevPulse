import crypto from "crypto";
import { Router, raw } from "express";
import { env } from "../config/env.js";
import { authenticate } from "../middleware/auth.js";
import { asyncHandler } from "../shared/asyncHandler.js";
import { ok } from "../shared/apiResponse.js";
import { AppError } from "../shared/errors.js";
import { prisma } from "../shared/prisma.js";
import { verifyHmacSignature } from "../shared/crypto.js";

export const webhookRoutes = Router();

webhookRoutes.post("/github", raw({ type: "application/json" }), asyncHandler(async (req, res) => {
  const payload = Buffer.isBuffer(req.body) ? req.body.toString("utf8") : JSON.stringify(req.body);
  const valid = verifyHmacSignature(payload, req.header("x-hub-signature-256"), env.GITHUB_WEBHOOK_SECRET);
  if (!valid && env.NODE_ENV === "production") throw new AppError(401, "INVALID_WEBHOOK_SIGNATURE", "GitHub webhook signature verification failed.");
  const body = JSON.parse(payload) as { repository?: { id?: number; full_name?: string } };
  const repository = body.repository?.id
    ? await prisma.repository.findUnique({ where: { githubRepositoryId: String(body.repository.id) } })
    : body.repository?.full_name
      ? await prisma.repository.findUnique({ where: { fullName: body.repository.full_name } })
      : null;
  const event = await prisma.webhookEvent.upsert({
    where: { deliveryId: req.header("x-github-delivery") ?? crypto.createHash("sha256").update(payload).digest("hex") },
    create: {
      eventType: req.header("x-github-event") ?? "unknown",
      deliveryId: req.header("x-github-delivery") ?? crypto.createHash("sha256").update(payload).digest("hex"),
      repositoryId: repository?.id,
      payloadHash: crypto.createHash("sha256").update(payload).digest("hex"),
      status: "queued"
    },
    update: { status: "queued", processedAt: null }
  });
  await applyWebhookPayload(event.eventType, body, repository?.id);
  await prisma.webhookEvent.update({ where: { id: event.id }, data: { status: "processed", processedAt: new Date() } });
  await prisma.syncJob.create({ data: { repositoryId: repository?.id, jobType: `webhook:${event.eventType}`, status: "queued", payload: body as object } });
  ok(res, { accepted: true, eventType: event.eventType, deliveryId: event.deliveryId, processing: "queued" }, undefined, 202);
}));

webhookRoutes.get("/events", authenticate, asyncHandler(async (_req, res) => ok(res, await prisma.webhookEvent.findMany({ orderBy: { processedAt: "desc" }, take: 100 }))));

async function applyWebhookPayload(eventType: string, payload: Record<string, unknown>, repositoryId?: string) {
  if (!repositoryId) return;
  if (eventType === "push") {
    const commits = Array.isArray(payload.commits) ? payload.commits as Array<Record<string, unknown>> : [];
    await Promise.all(commits.map((commit) => prisma.commit.upsert({
      where: { commitSHA: String(commit.id) },
      create: {
        repositoryId,
        commitSHA: String(commit.id),
        message: String(commit.message ?? ""),
        additions: 0,
        deletions: 0,
        totalChanges: 0,
        filesChanged: 0,
        commitDate: commit.timestamp ? new Date(String(commit.timestamp)) : new Date(),
        url: typeof commit.url === "string" ? commit.url : null
      },
      update: {
        message: String(commit.message ?? ""),
        commitDate: commit.timestamp ? new Date(String(commit.timestamp)) : new Date(),
        url: typeof commit.url === "string" ? commit.url : null
      }
    })));
  }
  if (eventType === "pull_request" && payload.pull_request && typeof payload.pull_request === "object") {
    const pr = payload.pull_request as Record<string, unknown>;
    await prisma.pullRequest.upsert({
      where: { repositoryId_githubPRNumber: { repositoryId, githubPRNumber: Number(pr.number) } },
      create: {
        repositoryId,
        githubPRNumber: Number(pr.number),
        title: String(pr.title ?? ""),
        description: typeof pr.body === "string" ? pr.body : null,
        state: pr.merged_at ? "MERGED" : pr.state === "open" ? "OPEN" : "CLOSED",
        createdAtGitHub: pr.created_at ? new Date(String(pr.created_at)) : new Date(),
        mergedAt: pr.merged_at ? new Date(String(pr.merged_at)) : null,
        closedAt: pr.closed_at ? new Date(String(pr.closed_at)) : null,
        url: typeof pr.html_url === "string" ? pr.html_url : null
      },
      update: {
        title: String(pr.title ?? ""),
        description: typeof pr.body === "string" ? pr.body : null,
        state: pr.merged_at ? "MERGED" : pr.state === "open" ? "OPEN" : "CLOSED",
        mergedAt: pr.merged_at ? new Date(String(pr.merged_at)) : null,
        closedAt: pr.closed_at ? new Date(String(pr.closed_at)) : null,
        url: typeof pr.html_url === "string" ? pr.html_url : null
      }
    });
  }
  if (eventType === "issues" && payload.issue && typeof payload.issue === "object") {
    const issue = payload.issue as Record<string, unknown>;
    await prisma.issue.upsert({
      where: { repositoryId_githubIssueNumber: { repositoryId, githubIssueNumber: Number(issue.number) } },
      create: {
        repositoryId,
        githubIssueNumber: Number(issue.number),
        title: String(issue.title ?? ""),
        body: typeof issue.body === "string" ? issue.body : null,
        state: String(issue.state ?? "open"),
        labels: [],
        comments: Number(issue.comments ?? 0),
        createdAtGitHub: issue.created_at ? new Date(String(issue.created_at)) : new Date(),
        updatedAtGitHub: issue.updated_at ? new Date(String(issue.updated_at)) : null,
        closedAt: issue.closed_at ? new Date(String(issue.closed_at)) : null,
        url: typeof issue.html_url === "string" ? issue.html_url : null
      },
      update: {
        title: String(issue.title ?? ""),
        body: typeof issue.body === "string" ? issue.body : null,
        state: String(issue.state ?? "open"),
        comments: Number(issue.comments ?? 0),
        updatedAtGitHub: issue.updated_at ? new Date(String(issue.updated_at)) : null,
        closedAt: issue.closed_at ? new Date(String(issue.closed_at)) : null,
        url: typeof issue.html_url === "string" ? issue.html_url : null
      }
    });
  }
  if (eventType === "release" && payload.release && typeof payload.release === "object") {
    const release = payload.release as Record<string, unknown>;
    await prisma.release.upsert({
      where: { repositoryId_githubReleaseId: { repositoryId, githubReleaseId: String(release.id) } },
      create: {
        repositoryId,
        githubReleaseId: String(release.id),
        tagName: String(release.tag_name ?? ""),
        name: typeof release.name === "string" ? release.name : null,
        body: typeof release.body === "string" ? release.body : null,
        draft: Boolean(release.draft),
        prerelease: Boolean(release.prerelease),
        publishedAt: release.published_at ? new Date(String(release.published_at)) : null,
        createdAtGitHub: release.created_at ? new Date(String(release.created_at)) : null,
        url: typeof release.html_url === "string" ? release.html_url : null
      },
      update: {
        tagName: String(release.tag_name ?? ""),
        name: typeof release.name === "string" ? release.name : null,
        body: typeof release.body === "string" ? release.body : null,
        draft: Boolean(release.draft),
        prerelease: Boolean(release.prerelease),
        publishedAt: release.published_at ? new Date(String(release.published_at)) : null,
        url: typeof release.html_url === "string" ? release.html_url : null
      }
    });
  }
}
