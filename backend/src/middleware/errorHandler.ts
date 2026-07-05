import type { NextFunction, Request, Response } from "express";
import { logger } from "../config/logger.js";
import { fail } from "../shared/apiResponse.js";
import { AppError } from "../shared/errors.js";

export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction): Response {
  if (err instanceof AppError) {
    return fail(res, err.statusCode, err.code, err.message, err.details);
  }
  logger.error({ err, requestId: res.locals.requestId, path: req.path }, "Unhandled request error");
  return fail(res, 500, "INTERNAL_ERROR", "An unexpected error occurred.");
}
