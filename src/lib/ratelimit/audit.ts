import "server-only";
import { getServiceClient } from "@/lib/supabase";
import { logger } from "@/lib/observability/logger";
import { incrementCounter } from "@/lib/observability/metrics";

export interface RateLimitHitRecord {
  policyId: string;
  tenantId: string | null;
  ip: string | null;
  route: string | null;
  key: string;
  limit: number;
  windowMs: number;
}

type GlobalWithFlag = typeof globalThis & {
  __ziro_rate_limit_table_missing?: boolean;
};
const g = globalThis as GlobalWithFlag;

function isMissingTableError(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  const e = err as { code?: unknown; message?: unknown };
  if (e.code === "42P01" || e.code === "PGRST205") return true;
  return typeof e.message === "string" && /does not exist/i.test(e.message);
}

/**
 * Record a rate-limit hit. Best-effort only — never throws, never blocks
 * the request path. If the table doesn't exist yet, cache that flag so we
 * don't hammer Supabase with schema-missing errors.
 */
export async function recordRateLimitHit(hit: RateLimitHitRecord): Promise<void> {
  incrementCounter("rate_limit_hits_total", {
    policy: hit.policyId,
    tenant: hit.tenantId ?? "none",
  });
  logger.warn("ratelimit.hit", {
    policy: hit.policyId,
    tenantId: hit.tenantId,
    ip: hit.ip,
    route: hit.route,
    limit: hit.limit,
    windowMs: hit.windowMs,
  });

  if (g.__ziro_rate_limit_table_missing) return;

  try {
    const supabase = getServiceClient();
    const { error } = await supabase.from("rate_limit_hits").insert({
      policy_id: hit.policyId,
      tenant_id: hit.tenantId,
      ip: hit.ip,
      route: hit.route,
      key: hit.key,
      max_allowed: hit.limit,
      window_ms: hit.windowMs,
      created_at: new Date().toISOString(),
    });
    if (error && isMissingTableError(error)) {
      g.__ziro_rate_limit_table_missing = true;
    }
  } catch (err) {
    if (isMissingTableError(err)) g.__ziro_rate_limit_table_missing = true;
  }
}
