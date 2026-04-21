import "server-only";
import { getServiceClient } from "@/lib/supabase";
const g = globalThis;
function getRegistry() {
    if (!g.__ziro_health_registry) {
        g.__ziro_health_registry = new Map();
        registerDefaults(g.__ziro_health_registry);
    }
    return g.__ziro_health_registry;
}
export function registerHealthCheck(name, check) {
    getRegistry().set(name, check);
}
export function unregisterHealthCheck(name) {
    getRegistry().delete(name);
}
function rollup(checks) {
    if (checks.some((c) => c.status === "down"))
        return "down";
    if (checks.some((c) => c.status === "degraded"))
        return "degraded";
    return "ok";
}
export async function runHealthChecks() {
    const entries = Array.from(getRegistry().entries());
    const results = await Promise.all(entries.map(async ([name, fn]) => {
        const started = Date.now();
        try {
            const result = await withTimeout(fn(), 5000);
            return Object.assign(Object.assign({}, result), { name, latencyMs: result.latencyMs || Date.now() - started });
        }
        catch (err) {
            return {
                name,
                status: "down",
                latencyMs: Date.now() - started,
                message: err instanceof Error ? err.message : "check failed",
            };
        }
    }));
    return {
        status: rollup(results),
        generatedAt: new Date().toISOString(),
        checks: results,
    };
}
async function withTimeout(p, ms) {
    return await Promise.race([
        p,
        new Promise((_, reject) => setTimeout(() => reject(new Error(`health check timed out after ${ms}ms`)), ms)),
    ]);
}
// --- default built-in checks -------------------------------------------------
function registerDefaults(registry) {
    registry.set("database", async () => {
        const started = Date.now();
        try {
            const sb = getServiceClient();
            const { error } = await sb.from("tenants").select("id", { head: true, count: "exact" }).limit(1);
            if (error && !/relation .*tenants.* does not exist/i.test(error.message)) {
                return { name: "database", status: "down", latencyMs: Date.now() - started, message: error.message };
            }
            return { name: "database", status: "ok", latencyMs: Date.now() - started };
        }
        catch (err) {
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
        }
        catch (err) {
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
        }
        catch (err) {
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
        }
        catch (err) {
            return {
                name: "messaging_queue",
                status: "down",
                latencyMs: Date.now() - started,
                message: err instanceof Error ? err.message : "unknown",
            };
        }
    });
}
