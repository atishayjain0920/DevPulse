import type { NextFunction, Request, Response } from "express";
import type { ZodSchema } from "zod";
import { AppError } from "../shared/errors.js";

type ValidationTarget = "body" | "query" | "params";

export function validate(target: ValidationTarget, schema: ZodSchema) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[target]);
    if (!result.success) {
      throw new AppError(400, "VALIDATION_FAILED", "Request validation failed.", result.error.flatten());
    }
    req[target] = result.data;
    next();
  };
}
