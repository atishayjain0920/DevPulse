import type { NextFunction, Request, Response } from "express";
import { nanoid } from "nanoid";

export function requestContext(req: Request, res: Response, next: NextFunction): void {
  const requestId = req.header("x-request-id") ?? nanoid();
  res.locals.requestId = requestId;
  res.setHeader("x-request-id", requestId);
  next();
}
