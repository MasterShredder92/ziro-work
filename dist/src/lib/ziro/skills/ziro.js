import { hasKeyword, parseTokens } from "./parse";
function baseMeta(args, extra = {}) {
    return Object.assign({ tenantId: args.tenantId, profileId: args.profileId, conversationId: args.conversationId }, extra);
}
const KNOWN_AGENT_SLUGS = ["star", "ruby", "bub", "stewie", "vader", "ziro", "sid"];
const systemCheck = {
    title: "System Check",
    description: "Run a lightweight health check across core subsystems.",
    async handler(args) {
        const tokens = parseTokens(args.input);
        return {
            result: {
                action: "system_check",
                checks: [
                    { name: "supabase", kind: "connectivity" },
                    { name: "anthropic", kind: "credentials" },
                    { name: "task_threads", kind: "db_table" },
                    { name: "task_messages", kind: "db_table" },
                    { name: "agents", kind: "db_table" },
                    { name: "skills", kind: "db_table" },
                    { name: "skill_packs", kind: "in_memory" },
                ],
                includeLatency: true,
                runId: `sc_${Date.now()}`,
            },
            metadata: baseMeta(args, { tokens }),
        };
    },
};
const kpiSnapshot = {
    title: "KPI Snapshot",
    description: "Compute the current snapshot of top-level workspace KPIs.",
    async handler(args) {
        const tokens = parseTokens(args.input);
        const windowDays = hasKeyword(tokens.raw, ["month"]) ? 30 : hasKeyword(tokens.raw, ["quarter"]) ? 90 : 7;
        return {
            result: {
                action: "kpi_snapshot",
                scope: { tenantId: args.tenantId, windowDays },
                kpis: [
                    "active_students",
                    "active_teachers",
                    "lessons_scheduled",
                    "lessons_taught",
                    "revenue_recognized",
                    "outstanding_balance",
                    "new_leads",
                    "converted_leads",
                ],
                compareToPreviousPeriod: true,
            },
            metadata: baseMeta(args, { tokens, windowDays }),
        };
    },
};
const usageReport = {
    title: "Usage Report",
    description: "Report workspace-level usage of agents, skills, and tokens.",
    async handler(args) {
        const tokens = parseTokens(args.input);
        const windowDays = hasKeyword(tokens.raw, ["month"]) ? 30 : hasKeyword(tokens.raw, ["quarter"]) ? 90 : 7;
        return {
            result: {
                action: "usage_report",
                scope: { tenantId: args.tenantId, windowDays },
                groupBy: ["agent_slug", "skill_slug"],
                metrics: [
                    "invocations",
                    "unique_users",
                    "input_tokens",
                    "output_tokens",
                    "avg_duration_ms",
                    "error_rate",
                ],
            },
            metadata: baseMeta(args, { tokens, windowDays }),
        };
    },
};
const agentDiagnostics = {
    title: "Agent Diagnostics",
    description: "Produce a diagnostic report for a specific agent or all agents.",
    async handler(args) {
        var _a;
        const tokens = parseTokens(args.input);
        const agentSlug = (_a = tokens.keywords.find((k) => KNOWN_AGENT_SLUGS.includes(k))) !== null && _a !== void 0 ? _a : null;
        const { getRecentSkillExecutions } = await import("../runtime/skillTelemetry");
        const buffer = getRecentSkillExecutions(500);
        const filtered = agentSlug
            ? buffer.filter((r) => r.agentSlug === agentSlug)
            : buffer;
        const terminal = filtered.filter((r) => r.phase === "success" || r.phase === "failure");
        const recentInvocations = terminal.slice(-20).map((r) => ({
            id: r.id,
            phase: r.phase,
            agentSlug: r.agentSlug,
            skillKey: r.skillKey,
            source: r.source,
            conversationId: r.conversationId,
            startedAt: r.startedAt,
            endedAt: r.endedAt,
            durationMs: r.durationMs,
        }));
        const recentFailures = terminal
            .filter((r) => r.phase === "failure")
            .slice(-5)
            .map((r) => ({
            id: r.id,
            agentSlug: r.agentSlug,
            skillKey: r.skillKey,
            source: r.source,
            startedAt: r.startedAt,
            endedAt: r.endedAt,
            durationMs: r.durationMs,
            error: r.error,
        }));
        const sourceCounts = { pack: 0, db: 0, unknown: 0 };
        for (const r of terminal) {
            if (r.source === "pack")
                sourceCounts.pack += 1;
            else if (r.source === "db")
                sourceCounts.db += 1;
            else
                sourceCounts.unknown += 1;
        }
        const total = sourceCounts.pack + sourceCounts.db + sourceCounts.unknown;
        const packRatio = total > 0 ? sourceCounts.pack / total : 0;
        const dbRatio = total > 0 ? sourceCounts.db / total : 0;
        const successes = terminal.filter((r) => r.phase === "success").length;
        const failures = terminal.filter((r) => r.phase === "failure").length;
        const successRate = terminal.length > 0 ? successes / terminal.length : 0;
        return {
            result: {
                action: "agent_diagnostics",
                scope: {
                    tenantId: args.tenantId,
                    agentId: tokens.id,
                    agentSlug,
                },
                probes: [
                    "last_invocation_at",
                    "success_rate_7d",
                    "avg_latency_ms_7d",
                    "tool_failure_rate_7d",
                    "skill_coverage",
                    "registry_consistency",
                ],
                recentInvocations,
                recentFailures,
                counts: {
                    total,
                    success: successes,
                    failure: failures,
                    pack: sourceCounts.pack,
                    db: sourceCounts.db,
                    unknown: sourceCounts.unknown,
                },
                ratios: {
                    packVsDb: {
                        pack: packRatio,
                        db: dbRatio,
                    },
                    successRate,
                },
            },
            metadata: baseMeta(args, {
                tokens,
                telemetrySampleSize: terminal.length,
            }),
        };
    },
};
const semanticSearch = {
    title: "Semantic Search",
    description: "Search the content library semantically across titles, descriptions, and tags.",
    async handler(args) {
        var _a;
        const tokens = parseTokens(args.input);
        const query = ((_a = args.input) !== null && _a !== void 0 ? _a : "").trim();
        const { searchContent } = await import("@/lib/content");
        const response = await searchContent(args.tenantId, query);
        return {
            result: {
                action: "semantic_search",
                scope: { tenantId: args.tenantId },
                query: response.query,
                results: response.results.map((r) => ({
                    id: r.item.id,
                    title: r.item.title,
                    kind: r.item.kind,
                    visibility: r.item.visibility,
                    score: r.score,
                    snippet: r.snippet,
                    matchedTags: r.matchedTags,
                })),
            },
            metadata: baseMeta(args, {
                tokens,
                resultCount: response.results.length,
            }),
        };
    },
};
export const ziro = {
    systemCheck,
    kpiSnapshot,
    usageReport,
    agentDiagnostics,
    semanticSearch,
};
export default ziro;
