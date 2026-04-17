import { AppError, mapLegacyMessage, type AppErrorJSON } from "./AppError";

/**
 * Normalize any thrown value into a stable wire shape.
 * Never leaks stack traces; never leaks raw DB error details unless the
 * error was already an AppError (in which case the caller chose what to share).
 */
export function serializeError(
  err: unknown,
  opts: { requestId?: string; exposeInternal?: boolean } = {},
): { status: number; body: AppErrorJSON } {
  if (AppError.isAppError(err)) {
    return {
      status: err.status,
      body: { ...err.toJSON(), requestId: opts.requestId ?? err.requestId },
    };
  }

  if (err instanceof Error) {
    const code = mapLegacyMessage(err.message);
    const wrapped = new AppError({
      code,
      message: code === "INTERNAL" ? "Internal server error" : err.message,
      cause: err,
      requestId: opts.requestId,
    });
    const body = wrapped.toJSON();
    if (opts.exposeInternal && code === "INTERNAL") {
      body.details = { originalMessage: err.message };
    }
    return { status: wrapped.status, body };
  }

  const wrapped = new AppError({
    code: "INTERNAL",
    message: "Internal server error",
    cause: err,
    requestId: opts.requestId,
  });
  return { status: wrapped.status, body: wrapped.toJSON() };
}
