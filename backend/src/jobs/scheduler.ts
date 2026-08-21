import { Prisma } from "@prisma/client";
import { Queue } from "bullmq";
import { Redis } from "ioredis";
import { env } from "../config/env.js";
import { logger } from "../config/logger.js";
import { prisma } from "../shared/prisma.js";

type JobName =
  | "github.sync"
  | "repository.sync"
  | "commit.sync"
  | "pr.sync"
  | "workflow.sync"
  | "issue.sync"
  | "ai.weekly-summary"
  | "risk.detect"
  | "notification.generate"
  | "repository.health.recalculate"
  | "developer.productivity.recalculate"
  | "report.generate"
  | "notification.deliver"
  | "sessions.cleanup"
  | "analytics.cache.refresh";

let schedulerErrorLogged = false;

export class JobScheduler {
  private queue?: Queue;

  constructor() {
    try {
      const connection = new Redis(env.REDIS_URL, { maxRetriesPerRequest: null });
      connection.on("error", (err) => {
        if (!schedulerErrorLogged) {
          logger.error(`Redis queue connection error: ${err.message} (subsequent connection errors will be silenced)`);
          schedulerErrorLogged = true;
        }
      });
      connection.on("connect", () => {
        schedulerErrorLogged = false;
        logger.info("Redis queue connected");
      });
      this.queue = new Queue("devpulse", { connection: connection as any });
    } catch (error) {
      logger.warn({ error }, "Redis queue unavailable; jobs will be persisted in PostgreSQL.");
    }
  }

  async enqueue(name: JobName, data: Record<string, unknown> = {}) {
    if (!this.queue) {
      const job = await prisma.syncJob.create({
        data: {
          jobType: name,
          status: "queued",
          payload: data as Prisma.InputJsonValue
        }
      });
      return { id: job.id, name, status: job.status, data };
    }
    const job = await this.queue.add(name, data, {
      attempts: 3,
      backoff: { type: "exponential", delay: 1000 },
      removeOnComplete: true,
      removeOnFail: 100
    });
    return { id: job.id, name, status: "queued", data };
  }
}

export const jobScheduler = new JobScheduler();
