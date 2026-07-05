import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import { pinoHttp } from "pino-http";
import swaggerUi from "swagger-ui-express";
import { env } from "./config/env.js";
import { logger } from "./config/logger.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { notFoundHandler } from "./middleware/notFound.js";
import { requestContext } from "./middleware/requestContext.js";
import { openApiSpec } from "./openapi.js";
import { apiRoutes } from "./routes/index.js";
import { ok } from "./shared/apiResponse.js";

export function createApp() {
  const app = express();

  app.use(requestContext);
  app.use(pinoHttp({ logger }));
  app.use(helmet({ contentSecurityPolicy: env.NODE_ENV === "production" ? undefined : false }));
  app.use(cors({ origin: env.FRONTEND_ORIGIN, credentials: true }));
  app.use(cookieParser());
  app.use(rateLimit({ windowMs: 15 * 60 * 1000, limit: 500, standardHeaders: true, legacyHeaders: false }));
  app.use((req, res, next) => {
    if (req.path === "/api/v1/webhooks/github") return next();
    express.json({ limit: "1mb" })(req, res, next);
  });

  app.get("/health", (_req, res) => ok(res, { status: "ok", service: "devpulse-api", version: "1.0.0" }));
  app.use("/docs", swaggerUi.serve, swaggerUi.setup(openApiSpec));
  app.use("/api/v1", apiRoutes);
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
