import { randomUUID } from "node:crypto";
const REQUEST_ID_HEADER = "x-request-id";
export function getOrCreateRequestId(headers) {
    const existing = typeof headers.get === "function"
        ? headers.get(REQUEST_ID_HEADER)
        : headers[REQUEST_ID_HEADER];
    if (existing && typeof existing === "string" && existing.trim().length > 0) {
        return existing.trim();
    }
    try {
        return randomUUID();
    }
    catch (_a) {
        return `req_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
    }
}
export { REQUEST_ID_HEADER };
