import type { Response } from 'express';

export class HttpError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = 'HttpError';
  }
}

export function json<T>(res: Response, data: T, status = 200): void {
  res.status(status).json(data);
}

export function error(res: Response, code: string, message: string, status: number): void {
  res.status(status).json({ error: { code, message } });
}

export function handleError(res: Response, err: unknown): void {
  if (err instanceof HttpError) {
    error(res, err.code, err.message, err.status);
    return;
  }
  const message = err instanceof Error ? err.message : 'Unexpected error';
  error(res, 'INTERNAL_ERROR', message, 500);
}
