import { beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "../src/shared/prisma.js";
import { aiService } from "../src/modules/ai/ai.service.js";

vi.mock("@google/genai", () => {
  return {
    GoogleGenAI: class {
      models = {
        generateContent: async () => ({
          text: "Here are the stale pull requests: PR 1, PR 2."
        })
      };
    }
  };
});

const emptyCounts = {
  repository: async () => 0,
  commit: async () => 0,
  pullRequest: async () => 0
};

const dbDouble = {
  repository: { count: emptyCounts.repository, findMany: async () => [] },
  commit: { count: emptyCounts.commit, findMany: async () => [] },
  pullRequest: { count: emptyCounts.pullRequest, findMany: async (): Promise<Array<Record<string, unknown>>> => [] }
};

function resetDbDouble() {
  dbDouble.repository.count = emptyCounts.repository;
  dbDouble.commit.count = emptyCounts.commit;
  dbDouble.pullRequest.count = emptyCounts.pullRequest;
  dbDouble.pullRequest.findMany = async () => [];
}

function installDbDouble() {
  Object.assign(prisma.repository, dbDouble.repository);
  Object.assign(prisma.commit, dbDouble.commit);
  Object.assign(prisma.pullRequest, dbDouble.pullRequest);
}

describe("aiService", () => {
  beforeEach(() => {
    resetDbDouble();
    installDbDouble();
  });

  it("answers analytics questions transparently", async () => {
    dbDouble.pullRequest.count = async () => 2;
    const oldDate = new Date(Date.now() - 60 * 24 * 3600 * 1000);
    dbDouble.pullRequest.findMany = async () => [
      { repository: { fullName: "owner/repo" }, title: "PR 1", state: "OPEN", comments: 0, reviews: [], createdAtGitHub: oldDate },
      { repository: { fullName: "owner/repo" }, title: "PR 2", state: "OPEN", comments: 0, reviews: [], createdAtGitHub: oldDate }
    ];
    installDbDouble();

    const response = await aiService.chat("Show stale pull requests");
    expect(response.answer.toLowerCase()).toMatch(/stale pull request|pr 1|pr 2/);
    expect(response.disclaimer).toContain("AI-generated");
  }, 15000);

  it("does not hallucinate unknown answers", async () => {
    const response = await aiService.chat("What is the customer revenue forecast?");
    expect(response.answer).toBe("I could not find sufficient synced project data to answer that yet.");
  });
});
