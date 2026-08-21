import fs from "fs/promises";
import path from "path";
import { Router } from "express";
import { z } from "zod";
import { authenticate } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { asyncHandler } from "../shared/asyncHandler.js";
import { ok } from "../shared/apiResponse.js";
import { prisma } from "../shared/prisma.js";

export const reportRoutes = Router();
reportRoutes.use(authenticate);

const reportRequest = z.object({
  reportType: z.enum(["developer", "repository", "organization", "weekly", "monthly", "executive"]),
  dateRange: z.object({ from: z.string(), to: z.string() }).optional()
});

async function queued(userId: string, format: "pdf" | "excel" | "csv" | "json", body: z.infer<typeof reportRequest>) {
  const job = await prisma.exportJob.create({
    data: {
      userId,
      reportType: body.reportType,
      format,
      status: "queued"
    }
  });

  // Try jobScheduler or direct async fallback execution
  try {
    const { jobScheduler } = await import("../jobs/scheduler.js");
    await jobScheduler.enqueue("report.generate", { reportId: job.id, userId });
  } catch (e) {
    // If Redis/jobScheduler is not available, execute generateReport in background
    setTimeout(async () => {
      try {
        const data = await prisma.exportJob.findUnique({ where: { id: job.id } });
        if (data) {
          const reportsDir = path.join(process.cwd(), "reports");
          await fs.mkdir(reportsDir, { recursive: true });
          const fileName = `report_${job.id}.${format.toLowerCase()}`;
          const filePath = path.join(reportsDir, fileName);
          const fileLocation = `/reports/${fileName}`;
          
          const kpis = await (await import("../modules/analytics/analytics.service.js")).analyticsService.getEngineeringKpis(userId);
          if (format.toUpperCase() === "JSON") {
            await fs.writeFile(filePath, JSON.stringify(kpis, null, 2));
          } else {
            const csvContent = Object.entries(kpis).map(([k, v]) => `${k},${v}`).join("\n");
            await fs.writeFile(filePath, `Metric,Value\n${csvContent}`);
          }
          await prisma.exportJob.update({ where: { id: job.id }, data: { status: "completed", fileLocation, completedAt: new Date() } });
        }
      } catch (err) {
        await prisma.exportJob.update({ where: { id: job.id }, data: { status: "failed" } }).catch(() => {});
      }
    }, 100);
  }

  return job;
}

reportRoutes.post("/pdf", validate("body", reportRequest), asyncHandler(async (req, res) => ok(res, await queued(req.user!.id, "pdf", req.body), undefined, 202)));
reportRoutes.post("/excel", validate("body", reportRequest), asyncHandler(async (req, res) => ok(res, await queued(req.user!.id, "excel", req.body), undefined, 202)));
reportRoutes.post("/csv", validate("body", reportRequest), asyncHandler(async (req, res) => ok(res, await queued(req.user!.id, "csv", req.body), undefined, 202)));
reportRoutes.post("/json", validate("body", reportRequest), asyncHandler(async (req, res) => ok(res, await queued(req.user!.id, "json", req.body), undefined, 202)));
reportRoutes.get("/history", asyncHandler(async (req, res) => ok(res, await prisma.exportJob.findMany({ where: { userId: req.user!.id }, orderBy: { requestedAt: "desc" } }))));
