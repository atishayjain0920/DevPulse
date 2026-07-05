import { beforeEach, describe, expect, it } from "vitest";
import { prisma } from "../src/shared/prisma.js";
import { analyticsService } from "../src/modules/analytics/analytics.service.js";

const dbDouble = {
  commit: { count: async () => 0 },
  pullRequest: { count: async () => 0, findMany: async (): Promise<Array<Record<string, unknown>>> => [] },
  pullRequestReview: { count: async () => 0 },
  developerProfile: { findUnique: async () => null },
  workflowRun: { findMany: async (): Promise<Array<Record<string, unknown>>> => [] },
  repositoryRisk: { findMany: async (): Promise<Array<Record<string, unknown>>> => [] },
  repositoryHealth: { findFirst: async () => null }
};

function installDbDouble() {
  Object.assign(prisma.commit, dbDouble.commit);
  Object.assign(prisma.pullRequest, dbDouble.pullRequest);
  Object.assign(prisma.pullRequestReview, dbDouble.pullRequestReview);
  Object.assign(prisma.developerProfile, dbDouble.developerProfile);
  Object.assign(prisma.workflowRun, dbDouble.workflowRun);
  Object.assign(prisma.repositoryRisk, dbDouble.repositoryRisk);
  Object.assign(prisma.repositoryHealth, dbDouble.repositoryHealth);
}

describe("analyticsService", () => {
  beforeEach(() => {
    installDbDouble();
  });

  it("calculates weighted productivity scores in the 0-100 range", async () => {
    dbDouble.commit.count = async () => 4;
    dbDouble.pullRequest.count = async () => 2;
    dbDouble.pullRequestReview.count = async () => 3;
    dbDouble.developerProfile.findUnique = async () => null;

    const score = await analyticsService.calculateProductivityScore("usr_real");
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
  });

  it("calculates repository health with risk interpretation", async () => {
    dbDouble.workflowRun.findMany = async () => [{ conclusion: "success" }, { conclusion: "failure" }];
    dbDouble.pullRequest.findMany = async () => [{ state: "OPEN" }, { state: "MERGED" }];
    dbDouble.repositoryRisk.findMany = async () => [{ id: "risk_real" }];
    dbDouble.commit.count = async () => 12;
    dbDouble.repositoryHealth.findFirst = async () => null;

    const health = await analyticsService.calculateRepositoryHealth("repo_real");
    expect(health.overallScore).toBeGreaterThanOrEqual(0);
    expect(["Excellent", "Healthy", "Needs Attention", "Critical"]).toContain(health.riskLevel);
  });
});
