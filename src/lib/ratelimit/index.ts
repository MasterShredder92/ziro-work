import type { NextRequest } from "next/server";
import { AppError } from "@/lib/errors/AppError";
import {
  checkLimit,
  ipKey,
  tenantIpKey,
  tenantKey,
  type LimiterDecision,
  type LimiterPolicy,
} from "./limiter";
import { POLICIES } from "./policies";
import { recordRateLimitHit } from "./audit";

export { POLICIES } from "./policies";
export { checkLimit, peekLimit, resetLimit, ipKey, tenantIpKey, tenantKey } from "./limiter";
export type { LimiterDecision, LimiterPolicy } from "./limiter";

/** Extract a best-effort request IP from common proxy headers. */
export function extractIp(req: Request | NextRequest): string {
  const headers = req.headers;
  const fwd = headers.get("x-forwarded-for");
  if (fwd) {
    const first = fwd.split(",")[0]?.trim();
    if (first) return first;
  }
  const real = headers.get("x-real-ip");
  if (real) return real.trim();
  const cf = headers.get("cf-connecting-ip");
  if (cf) return cf.trim();
  return "unknown";
}

export interface EnforceLimitArgs {
  req: Request | NextRequest;
  policy: LimiterPolicy;
  tenantId?: string | null;
  ip?: string | null;
  route?: string | null;
  /** When true (default), both tenant-scoped and ip-scoped buckets are checked. */
  composite?: boolean;
}

export interface EnforceLimitResult {
  allowed: boolean;
  decision: LimiterDecision;
  tripped?: { scope: "tenant" | "ip" | "tenant+ip"; decision: LimiterDecision };
}

/**
 * Enforce a rate-limit policy. Returns `allowed:false` when any bucket is
 * exhausted and records an audit entry. Call sites decide how to respond
 * (HTTP 429, silent backoff, etc.) — this keeps the helper unopinionated.
 */
export async function enforceLimit(args: EnforceLimitArgs): Promise<EnforceLimitResult> {
  const ip = (args.ip ?? extractIp(args.req)) || "unknown";
  const tenantId = args.tenantId ?? null;
  const composite = args.composite ?? true;

  const ipDecision = checkLimit(ipKey(args.policy.id, ip), args.policy);
  if (!ipDecision.ok) {
    await recordRateLimitHit({
      policyId: args.policy.id,
      tenantId,
      ip,
      route: args.route ?? null,
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
        route: args.route ?? null,
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
          route: args.route ?? null,
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
export async function enforceOrThrow(args: EnforceLimitArgs): Promise<void> {
  const result = await enforceLimit(args);
  if (!result.allowed) {
    throw AppError.rateLimited("Too many requests", {
      policy: args.policy.id,
      scope: result.tripped?.scope,
      retryAfterMs: Math.max(0, result.decision.resetAt - Date.now()),
    });
  }
}

/** IP-level burst ceiling applied before any more specific policy. */
export async function enforceIpBurst(
  req: Request | NextRequest,
  route?: string,
): Promise<EnforceLimitResult> {
  return enforceLimit({ req, policy: POLICIES.ipBurst, route: route ?? null });
}
