/**
 * Standardized application error.
 *
 * All errors that escape API route handlers or server actions should either
 * be an `AppError` or be wrapped as one by `serializeError` / `withApi`.
 *
 * Shape is stable across the wire:
 *   { code, message, details?, requestId? }
 */

export type AppErrorCode =
  | "BAD_REQUEST"
  | "UNAUTHENTICATED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "RATE_LIMITED"
  | "VALIDATION"
  | "UNPROCESSABLE"
  | "INTERNAL"
  | "UPSTREAM"
  | "UNAVAILABLE";

const DEFAULT_STATUS: Record<AppErrorCode, number> = {
  BAD_REQUEST: 400,
  VALIDATION: 400,
  UNAUTHENTICATED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE: 422,
  RATE_LIMITED: 429,
  INTERNAL: 500,
  UPSTREAM: 502,
  UNAVAILABLE: 503,
};

export interface AppErrorJSON {
  code: AppErrorCode | string;
  message: string;
  details?: unknown;
  requestId?: string;
}

export interface AppErrorOptions {
  code: AppErrorCode;
  message: string;
  status?: number;
  details?: unknown;
  cause?: unknown;
  requestId?: string;
}

export class AppError extends Error {
  public readonly code: AppErrorCode;
  public readonly status: number;
  public readonly details?: unknown;
  public readonly requestId?: string;

  constructor(opts: AppErrorOptions) {
    super(opts.message);
    this.name = "AppError";
    this.code = opts.code;
    this.status = opts.status ?? DEFAULT_STATUS[opts.code] ?? 500;
    this.details = opts.details;
    this.requestId = opts.requestId;
    if (opts.cause !== undefined) {
      (this as Error & { cause?: unknown }).cause = opts.cause;
    }
  }

  toJSON(): AppErrorJSON {
    const out: AppErrorJSON = { code: this.code, message: this.message };
    if (this.details !== undefined) out.details = this.details;
    if (this.requestId) out.requestId = this.requestId;
    return out;
  }

  static badRequest(message: string, details?: unknown): AppError {
    return new AppError({ code: "BAD_REQUEST", message, details });
  }
  static unauthenticated(message = "Authentication required"): AppError {
    return new AppError({ code: "UNAUTHENTICATED", message });
  }
  static forbidden(message = "Forbidden"): AppError {
    return new AppError({ code: "FORBIDDEN", message });
  }
  static notFound(message = "Not found"): AppError {
    return new AppError({ code: "NOT_FOUND", message });
  }
  static conflict(message: string, details?: unknown): AppError {
    return new AppError({ code: "CONFLICT", message, details });
  }
  static rateLimited(message = "Too many requests", details?: unknown): AppError {
    return new AppError({ code: "RATE_LIMITED", message, details });
  }
  static validation(message: string, details?: unknown): AppError {
    return new AppError({ code: "VALIDATION", message, details });
  }
  static internal(message = "Internal server error", cause?: unknown): AppError {
    return new AppError({ code: "INTERNAL", message, cause });
  }
  static upstream(message = "Upstream failure", cause?: unknown): AppError {
    return new AppError({ code: "UPSTREAM", message, cause });
  }

  static isAppError(err: unknown): err is AppError {
    return err instanceof AppError;
  }
}

export function mapLegacyMessage(message: string): AppErrorCode {
  const m = message.trim().toUpperCase();
  if (m === "FORBIDDEN") return "FORBIDDEN";
  if (m === "UNAUTHENTICATED") return "UNAUTHENTICATED";
  if (m === "NOT_FOUND") return "NOT_FOUND";
  if (m === "BAD_REQUEST") return "BAD_REQUEST";
  if (m === "CONFLICT") return "CONFLICT";
  if (m === "RATE_LIMITED") return "RATE_LIMITED";
  return "INTERNAL";
}
