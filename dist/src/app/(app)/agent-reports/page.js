import { jsx as _jsx } from "react/jsx-runtime";
import { AgentReportsClient } from "./_client";
import { SEED_TASKS, buildPeriodSummary } from "@/lib/agents/agentSavings";
export const dynamic = "force-dynamic";
export const metadata = { title: "Agent Reports — ZiroWork" };
export default function AgentReportsPage() {
    const now = new Date();
    // This month
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const monthEnd = now.toISOString();
    const monthLabel = now.toLocaleString("en-US", { month: "long", year: "numeric" });
    // This week (Mon–Sun)
    const day = now.getDay();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - ((day + 6) % 7));
    weekStart.setHours(0, 0, 0, 0);
    const weekLabel = `Week of ${weekStart.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
    const monthly = buildPeriodSummary(monthLabel, monthStart, monthEnd, SEED_TASKS);
    const weekly = buildPeriodSummary(weekLabel, weekStart.toISOString(), monthEnd, SEED_TASKS);
    return _jsx(AgentReportsClient, { monthly: monthly, weekly: weekly });
}
