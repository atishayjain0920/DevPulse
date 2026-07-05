import type { Request, Response } from "express";
import { fail } from "../shared/apiResponse.js";

export function notFoundHandler(req: Request, res: Response): Response {
  return fail(res, 404, "ROUTE_NOT_FOUND", `No route exists for ${req.method} ${req.path}.`);
}
