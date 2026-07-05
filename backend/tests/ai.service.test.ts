import { beforeEach, describe, expect, it } from "vitest";
import { prisma } from "../src/shared/prisma.js";
import { aiService } from "../src/modules/ai/ai.service.js";

const dbDouble = {
  repository: { count: async () => 0 },
  commit: { count: async () => 0 },
  pullRequest: { count: async () => 0 }
};

function installDbDouble() {
  Object.assign(prisma.repository, dbDouble.repository);
  Object.assign(prisma.commit, dbDouble.commit);
  Object.assign(prisma.pullRequest, dbDouble.pullRequest);
}

describe("aiService", () => {
  beforeEach(() => {
    installDbDouble();
  });

  it("answers analytics questions transparently", async () => {
    dbDouble.pullRequest.count = async () => 2;
    installDbDouble();

    const response = await aiService.chat("Show stale pull requests");
    expect(response.answer).toContain("2 open pull request");
    expect(response.disclaimer).toContain("AI-generated");
  });

  it("does not hallucinate unknown answers", async () => {
    const response = await aiService.chat("What is the customer revenue forecast?");
    expect(response.answer).toBe("I could not find sufficient synced project data to answer that yet.");
  });
});
