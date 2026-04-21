/**
 * Standardized application error.
 *
 * All errors that escape API route handlers or server actions should either
 * be an `AppError` or be wrapped as one by `serializeError` / `withApi`.
 *
 * Shape is stable across the wire:
 *   { code, message, details?, requestId? }
 */
const DEFAULT_STATUS = {
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
export class AppError extends Error {
    constructor(opts) {
        var _a, _b;
        super(opts.message);
        this.name = "AppError";
        this.code = opts.code;
        this.status = (_b = (_a = opts.status) !== null && _a !== void 0 ? _a : DEFAULT_STATUS[opts.code]) !== null && _b !== void 0 ? _b : 500;
        this.details = opts.details;
        this.requestId = opts.requestId;
        if (opts.cause !== undefined) {
            this.cause = opts.cause;
        }
    }
    toJSON() {
        const out = { code: this.code, message: this.message };
        if (this.details !== undefined)
            out.details = this.details;
        if (this.requestId)
            out.requestId = this.requestId;
        return out;
    }
    static badRequest(message, details) {
        return new AppError({ code: "BAD_REQUEST", message, details });
    }
    static unauthenticated(message = "Authentication required") {
        return new AppError({ code: "UNAUTHENTICATED", message });
    }
    static forbidden(message = "Forbidden") {
        return new AppError({ code: "FORBIDDEN", message });
    }
    static notFound(message = "Not found") {
        return new AppError({ code: "NOT_FOUND", message });
    }
    static conflict(message, details) {
        return new AppError({ code: "CONFLICT", message, details });
    }
    static rateLimited(message = "Too many requests", details) {
        return new AppError({ code: "RATE_LIMITED", message, details });
    }
    static validation(message, details) {
        return new AppError({ code: "VALIDATION", message, details });
    }
    static internal(message = "Internal server error", cause) {
        return new AppError({ code: "INTERNAL", message, cause });
    }
    static upstream(message = "Upstream failure", cause) {
        return new AppError({ code: "UPSTREAM", message, cause });
    }
    static isAppError(err) {
        return err instanceof AppError;
    }
}
export function mapLegacyMessage(message) {
    const m = message.trim().toUpperCase();
    if (m === "FORBIDDEN")
        return "FORBIDDEN";
    if (m === "UNAUTHENTICATED")
        return "UNAUTHENTICATED";
    if (m === "NOT_FOUND")
        return "NOT_FOUND";
    if (m === "BAD_REQUEST")
        return "BAD_REQUEST";
    if (m === "CONFLICT")
        return "CONFLICT";
    if (m === "RATE_LIMITED")
        return "RATE_LIMITED";
    return "INTERNAL";
}
