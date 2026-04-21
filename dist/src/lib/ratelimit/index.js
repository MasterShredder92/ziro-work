import { AppError } from "@/lib/errors/AppError";
import { checkLimit, ipKey, tenantIpKey, tenantKey, } from "./limiter";
import { POLICIES } from "./policies";
import { recordRateLimitHit } from "./audit";
export { POLICIES } from "./policies";
export { checkLimit, peekLimit, resetLimit, ipKey, tenantIpKey, tenantKey } from "./limiter";
/** Extract a best-effort request IP from common proxy headers. */
export function extractIp(req) {
    var _a;
    const headers = req.headers;
    const fwd = headers.get("x-forwarded-for");
    if (fwd) {
        const first = (_a = fwd.split(",")[0]) === null || _a === void 0 ? void 0 : _a.trim();
        if (first)
            return first;
    }
    const real = headers.get("x-real-ip");
    if (real)
        return real.trim();
    const cf = headers.get("cf-connecting-ip");
    if (cf)
        return cf.trim();
    return "unknown";
}
/**
 * Enforce a rate-limit policy. Returns `allowed:false` when any bucket is
 * exhausted and records an audit entry. Call sites decide how to respond
 * (HTTP 429, silent backoff, etc.) — this keeps the helper unopinionated.
 */
export async function enforceLimit(args) {
    var _a, _b, _c, _d, _e, _f;
    const ip = ((_a = args.ip) !== null && _a !== void 0 ? _a : extractIp(args.req)) || "unknown";
    const tenantId = (_b = args.tenantId) !== null && _b !== void 0 ? _b : null;
    const composite = (_c = args.composite) !== null && _c !== void 0 ? _c : true;
    const ipDecision = checkLimit(ipKey(args.policy.id, ip), args.policy);
    if (!ipDecision.ok) {
        await recordRateLimitHit({
            policyId: args.policy.id,
            tenantId,
            ip,
            route: (_d = args.route) !== null && _d !== void 0 ? _d : null,
            key: ipKey(args.policy.id, ip),
            limit: args.policy.max,
            windowMs: args.policy.windowMs,
        });
        return { allowed: false, decision: ipDecision, tripped: { scope: "ip", decision: ipDecision } };
    }
    if (tenantId) {
        const tDecision = checkLimit(tenantKey(args.policy.id, tenantId), args.policy);
        if (!tDecision.ok) {
            await recordRateLimitHit({
                policyId: args.policy.id,
                tenantId,
                ip,
                route: (_e = args.route) !== null && _e !== void 0 ? _e : null,
                key: tenantKey(args.policy.id, tenantId),
                limit: args.policy.max,
                windowMs: args.policy.windowMs,
            });
            return {
                allowed: false,
                decision: tDecision,
                tripped: { scope: "tenant", decision: tDecision },
            };
        }
        if (composite) {
            const tipDecision = checkLimit(tenantIpKey(args.policy.id, tenantId, ip), args.policy);
            if (!tipDecision.ok) {
                await recordRateLimitHit({
                    policyId: args.policy.id,
                    tenantId,
                    ip,
                    route: (_f = args.route) !== null && _f !== void 0 ? _f : null,
                    key: tenantIpKey(args.policy.id, tenantId, ip),
                    limit: args.policy.max,
                    windowMs: args.policy.windowMs,
                });
                return {
                    allowed: false,
                    decision: tipDecision,
                    tripped: { scope: "tenant+ip", decision: tipDecision },
                };
            }
            return { allowed: true, decision: tipDecision };
        }
        return { allowed: true, decision: tDecision };
    }
    return { allowed: true, decision: ipDecision };
}
/** Enforce and throw an AppError.rateLimited when the bucket is exhausted. */
export async function enforceOrThrow(args) {
    var _a;
    const result = await enforceLimit(args);
    if (!result.allowed) {
        throw AppError.rateLimited("Too many requests", {
            policy: args.policy.id,
            scope: (_a = result.tripped) === null || _a === void 0 ? void 0 : _a.scope,
            retryAfterMs: Math.max(0, result.decision.resetAt - Date.now()),
        });
    }
}
/** IP-level burst ceiling applied before any more specific policy. */
export async function enforceIpBurst(req, route) {
    return enforceLimit({ req, policy: POLICIES.ipBurst, route: route !== null && route !== void 0 ? route : null });
}
