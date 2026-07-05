export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly code: string,
    message: string,
    public readonly details?: unknown
  ) {
    super(message);
  }
}

export const notFound = (resource: string) => new AppError(404, "NOT_FOUND", `${resource} was not found.`);
