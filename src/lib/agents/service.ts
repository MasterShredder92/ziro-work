import { createClient } from "@supabase/supabase-js";
import { AGENT_CONFIGS, AGENT_ORDER, calcTaskCost } from "./config";
import type {
  AgentName,
  AgentStats,
  AgentEvent,
  CrewDashboardData,
} from "./types";

function getPlatformClient() {
  const url = process.env.PLATFORM_SUPABASE_URL;
  const key = process.env.PLATFORM_SUPABASE_SERVICE_KEY;
  if (!url || !key) {
    throw new Error(
      "PLATFORM_SUPABASE_URL and PLATFORM_SUPABASE_SERVICE_KEY must be set"
    );
  }
  return createClient(url, key);
}

export async function getCrewDashboard(
  tenantId: string,
  startDate: string,
  endDate: string,
): Promise<CrewDashboardData> {
  const client = getPlatformClient();

  const { data, error } = await client
    .from("ziro_events")
    .select("*")
    .eq("tenant_id", tenantId)
    .gte("created_at", startDate)
    .lte("created_at", endDate)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  const events = data ?? [];

  const agentStats: AgentStats[] = AGENT_ORDER.map((agentName) => {
    const config = AGENT_CONFIGS[agentName];
    const agentEvents = events.filter(
      (e) => e.agent_assigned === agentName
    );

    const mappedEvents: AgentEvent[] = agentEvents
      .slice(0, 50)
      .map((e) => ({
        id: e.id,
        event_id: e.event_id,
        event_type: e.event_type,
        agent_assigned: e.agent_assigned as AgentName,
        status: e.status,
        input_summary: e.input_summary,
        output_summary: e.output_summary,
        duration_ms: e.duration_ms,
        tokens_used: e.tokens_used,
        error_message: e.error_message,
        created_at: e.created_at,
        cost_usd: calcTaskCost(agentName, e.duration_ms ?? 0),
      }));

    const totalDurationMs = agentEvents.reduce(
      (sum, e) => sum + (e.duration_ms ?? 0), 0
    );

    const lastEvent = agentEvents[0];
    const lastStatus = lastEvent?.status ?? "idle";
    const status: AgentStats["status"] =
      lastStatus === "running" ? "running"
      : lastStatus === "failed" ? "failed"
      : lastStatus === "complete" ? "idle"
      : lastStatus === "stub" ? "stub"
      : "idle";

    return {
      agent: agentName,
      config,
      status,
      tasksThisMonth: agentEvents.length,
      totalDurationMs,
      totalCostUsd: calcTaskCost(agentName, totalDurationMs),
      lastActiveAt: lastEvent?.created_at ?? null,
      recentEvents: mappedEvents,
    };
  });

  const totalSavedThisMonth = agentStats.reduce(
    (sum, a) => sum + a.totalCostUsd, 0
  );
  const totalTasksThisMonth = agentStats.reduce(
    (sum, a) => sum + a.tasksThisMonth, 0
  );

  return {
    agents: agentStats,
    totalSavedThisMonth,
    totalTasksThisMonth,
    generatedAt: new Date().toISOString(),
    periodStart: startDate,
    periodEnd: endDate,
  };
}

export function getFilterPeriods() {
  const now = new Date();
  const thisMonthStart = new Date(
    now.getFullYear(), now.getMonth(), 1
  ).toISOString();
  const lastMonthStart = new Date(
    now.getFullYear(), now.getMonth() - 1, 1
  ).toISOString();
  const lastMonthEnd = new Date(
    now.getFullYear(), now.getMonth(), 0
  ).toISOString();
  const quarterStart = new Date(
    now.getFullYear(),
    Math.floor(now.getMonth() / 3) * 3, 1
  ).toISOString();
  const yearStart = new Date(
    now.getFullYear(), 0, 1
  ).toISOString();
  const lastYearStart = new Date(
    now.getFullYear() - 1, 0, 1
  ).toISOString();
  const lastYearEnd = new Date(
    now.getFullYear() - 1, 11, 31
  ).toISOString();

  return [
    {
      label: "This month",
      value: "this_month",
      startDate: thisMonthStart,
      endDate: now.toISOString(),
    },
    {
      label: "Last month",
      value: "last_month",
      startDate: lastMonthStart,
      endDate: lastMonthEnd,
    },
    {
      label: "This quarter",
      value: "quarter",
      startDate: quarterStart,
      endDate: now.toISOString(),
    },
    {
      label: "Year to date",
      value: "ytd",
      startDate: yearStart,
      endDate: now.toISOString(),
    },
    {
      label: "Last year",
      value: "last_year",
      startDate: lastYearStart,
      endDate: lastYearEnd,
    },
  ];
}
