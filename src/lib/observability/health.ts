import "server-only";
import { getServiceClient } from "@/lib/supabase";
import { assertServiceRoleAllowed } from "@/lib/supabaseAuthenticated";

export type HealthStatus = "ok" | "degraded" | "down";

export interface HealthCheckResult {
  name: string;
  status: HealthStatus;
  latencyMs: number;
  message?: string;
}

export interface HealthReport {
  status: HealthStatus;
  generatedAt: string;
  checks: HealthCheckResult[];
}

type HealthCheck = () => Promise<HealthCheckResult>;

type GlobalWithRegistry = typeof globalThis & {
  __ziro_health_registry?: Map<string, HealthCheck>;
};
const g = globalThis as GlobalWithRegistry;

function getRegistry(): Map<string, HealthCheck> {
  if (!g.__ziro_health_registry) {
    g.__ziro_health_registry = new Map();
    registerDefaults(g.__ziro_health_registry);
  }
  return g.__ziro_health_registry;
}

export function registerHealthCheck(name: string, check: HealthCheck): void {
  getRegistry().set(name, check);
}

export function unregisterHealthCheck(name: string): void {
  getRegistry().delete(name);
}

function rollup(checks: HealthCheckResult[]): HealthStatus {
  if (checks.some((c) => c.status === "down")) return "down";
  if (checks.some((c) => c.status === "degraded")) return "degraded";
  return "ok";
}

export async function runHealthChecks(): Promise<HealthReport> {
  const entries = Array.from(getRegistry().entries());
  const results = await Promise.all(
    entries.map(async ([name, fn]) => {
      const started = Date.now();
      try {
        const result = await withTimeout(fn(), 5_000);
        return {
          ...result,
          name,
          latencyMs: result.latencyMs || Date.now() - started,
        };
      } catch (err) {
        return {
          name,
          status: "down" as HealthStatus,
          latencyMs: Date.now() - started,
          message: err instanceof Error ? err.message : "check failed",
        };
      }
    }),
  );
  return {
    status: rollup(results),
    generatedAt: new Date().toISOString(),
    checks: results,
  };
}

async function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return await Promise.race([
    p,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`health check timed out after ${ms}ms`)), ms),
    ),
  ]);
}

// --- default built-in checks -------------------------------------------------

function registerDefaults(registry: Map<string, HealthCheck>): void {
  registry.set("database", async () => {
    const started = Date.now();
    try {
      assertServiceRoleAllowed("src/lib/observability/health.ts — service-role module; internal/background operations only");
      const sb = getServiceClient();
      const { error } = await sb.from("tenants").select("id", { head: true, count: "exact" }).limit(1);
      if (error && !/relation .*tenants.* does not exist/i.test(error.message)) {
        return { name: "database", status: "down", latencyMs: Date.now() - started, message: error.message };
      }
      return { name: "database", status: "ok", latencyMs: Date.now() - started };
    } catch (err) {
      return {
        name: "database",
        status: "down",
        latencyMs: Date.now() - started,
        message: err instanceof Error ? err.message : "unknown",
      };
    }
  });

  registry.set("storage", async () => {
    const started = Date.now();
    try {
      const sb = getServiceClient();
      const { error } = await sb.storage.listBuckets();
      if (error) {
        return { name: "storage", status: "degraded", latencyMs: Date.now() - started, message: error.message };
      }
      return { name: "storage", status: "ok", latencyMs: Date.now() - started };
    } catch (err) {
      return {
        name: "storage",
        status: "down",
        latencyMs: Date.now() - started,
        message: err instanceof Error ? err.message : "unknown",
      };
    }
  });

  registry.set("automation_queue", async () => {
    const started = Date.now();
    try {
      const sb = getServiceClient();
      const { error } = await sb
        .from("jobs")
        .select("id", { head: true, count: "exact" })
        .in("status", ["pending", "running"]);
      if (error) {
        if (/does not exist/i.test(error.message)) {
          return {
            name: "automation_queue",
            status: "degraded",
            latencyMs: Date.now() - started,
            message: "jobs table not yet provisioned",
          };
        }
        return { name: "automation_queue", status: "down", latencyMs: Date.now() - started, message: error.message };
      }
      return { name: "automation_queue", status: "ok", latencyMs: Date.now() - started };
    } catch (err) {
      return {
        name: "automation_queue",
        status: "down",
        latencyMs: Date.now() - started,
        message: err instanceof Error ? err.message : "unknown",
      };
    }
  });

  registry.set("messaging_queue", async () => {
    const started = Date.now();
    try {
      const sb = getServiceClient();
      const { error } = await sb
        .from("jobs")
        .select("id", { head: true, count: "exact" })
        .eq("kind", "messaging.delivery")
        .in("status", ["pending", "running"]);
      if (error) {
        if (/does not exist/i.test(error.message)) {
          return {
            name: "messaging_queue",
            status: "degraded",
            latencyMs: Date.now() - started,
            message: "jobs table not yet provisioned",
          };
        }
        return { name: "messaging_queue", status: "down", latencyMs: Date.now() - started, message: error.message };
      }
      return { name: "messaging_queue", status: "ok", latencyMs: Date.now() - started };
    } catch (err) {
      return {
        name: "messaging_queue",
        status: "down",
        latencyMs: Date.now() - started,
        message: err instanceof Error ? err.message : "unknown",
      };
    }
  });
}
