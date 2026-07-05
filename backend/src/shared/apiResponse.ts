import type { Response } from "express";

export type ApiMeta = {
  requestId?: string;
  timestamp: string;
  pagination?: {
    page: number;
    pageSize: number;
    total: number;
  };
};

export function ok<T>(res: Response, data: T, meta?: Partial<ApiMeta>, status = 200): Response {
  return res.status(status).json({
    success: true,
    data,
    meta: {
      timestamp: new Date().toISOString(),
      requestId: res.locals.requestId,
      ...meta
    }
  });
}

export function fail(res: Response, status: number, code: string, message: string, details?: unknown): Response {
  return res.status(status).json({
    success: false,
    error: { code, message, details },
    meta: {
      timestamp: new Date().toISOString(),
      requestId: res.locals.requestId
    }
  });
}
