import { NextResponse } from "next/server";
import { logger } from "@/lib/observability/logger";
import { REQUEST_ID_HEADER, getOrCreateRequestId } from "@/lib/observability/requestId";
import { incrementCounter } from "@/lib/observability/metrics";
import { AppError } from "./AppError";
import { serializeError } from "./serialize";
function retryAfterFromBody(body) {
    if (body.code !== "RATE_LIMITED")
        return null;
    if (!body.details || typeof body.details !== "object")
        return null;
    const retryAfterMs = body.details.retryAfterMs;
    if (typeof retryAfterMs !== "number" || !Number.isFinite(retryAfterMs))
        return null;
    const seconds = Math.max(1, Math.ceil(retryAfterMs / 1000));
    return String(seconds);
}
/**
 * Wrap an API route handler so all thrown values become structured, serialized
 * errors with a request id, and all unhandled exceptions are logged.
 *
 * Usage:
 *   export const GET = withApi({ name: "api.foo.GET" }, async (req) => { ... });
 */
export function withApi(opts, handler) {
    return async function wrapped(req, context) {
        const requestId = getOrCreateRequestId(req.headers);
        const log = logger.child({
            requestId,
            route: opts.name,
            subsystem: "api",
        });
        const started = Date.now();
        try {
            const res = await handler(req, context);
            const headers = new Headers(res.headers);
            if (!headers.get(REQUEST_ID_HEADER))
                headers.set(REQUEST_ID_HEADER, requestId);
            incrementCounter("api_requests_total", { route: opts.name, status: String(res.status) });
            log.info("api.request", {
                status: res.status,
                durationMs: Date.now() - started,
            });
            return new NextResponse(res.body, {
                status: res.status,
                statusText: res.statusText,
                headers,
            });
        }
        catch (err) {
            const { status, body } = serializeError(err, {
                requestId,
                exposeInternal: opts.exposeInternal,
            });
            if (status >= 500) {
                log.error("api.unhandled_exception", {
                    status,
                    code: body.code,
                    message: body.message,
                    durationMs: Date.now() - started,
                    error: err instanceof Error ? { name: err.name, message: err.message, stack: err.stack } : undefined,
                });
            }
            else {
                log.warn("api.handled_error", {
                    status,
                    code: body.code,
                    message: body.message,
                    durationMs: Date.now() - started,
                });
            }
            incrementCounter("api_errors_total", {
                route: opts.name,
                status: String(status),
                code: String(body.code),
            });
            const retryAfter = retryAfterFromBody(body);
            return NextResponse.json(body, {
                status,
                headers: Object.assign({ [REQUEST_ID_HEADER]: requestId, "Cache-Control": "no-store" }, (retryAfter ? { "Retry-After": retryAfter } : {})),
            });
        }
    };
}
export { AppError, serializeError };
