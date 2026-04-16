import type { Metadata } from "next";
import "./globals.css";
import "@/lib/agents/init";
import { startAgentRuntime } from "@/lib/agents/runtime";
import { runTool } from "@/lib/agents/tools";
import { getSupabase } from "@/lib/agents/supabase";

if (typeof window !== "undefined") {
  const tenantId = "dev";
  const ctx: any = {
    tenantId,
    userId: "system",
    role: "system",
  };

  ctx.supabase = getSupabase(tenantId);
  ctx.tools = {
    enqueue_task: (args: any) => runTool("enqueue_task", args, ctx),
    get_students: (args: any) => runTool("get_students", args, ctx),
    get_leads: (args: any) => runTool("get_leads", args, ctx),
    get_trials: (args: any) => runTool("get_trials", args, ctx),
    get_kpis: (args: any) => runTool("get_kpis", args, ctx),
    get_tenant_settings: (args: any) => runTool("get_tenant_settings", args, ctx),
    compute_tenant_kpis: (args: any) => runTool("compute_tenant_kpis", args, ctx),
    log_tenant_event: (args: any) => runTool("log_tenant_event", args, ctx),
    score_lead: (args: any) => runTool("score_lead", args, ctx),
    prioritize_trials: (args: any) => runTool("prioritize_trials", args, ctx),
    compute_lead_aging: (args: any) => runTool("compute_lead_aging", args, ctx),
    detect_inactive_leads: (args: any) => runTool("detect_inactive_leads", args, ctx),
    compute_trial_aging: (args: any) => runTool("compute_trial_aging", args, ctx),
    detect_inactive_trials: (args: any) => runTool("detect_inactive_trials", args, ctx),
    plan_trial_sequence: (args: any) => runTool("plan_trial_sequence", args, ctx),
    plan_outreach_sequence: (args: any) => runTool("plan_outreach_sequence", args, ctx),
    follow_up_lead: (args: any) => runTool("follow_up_lead", args, ctx),
    send_trial_reminder: (args: any) => runTool("send_trial_reminder", args, ctx),
    update_trial_status: (args: any) => runTool("update_trial_status", args, ctx),
    update_lead_status: (args: any) => runTool("update_lead_status", args, ctx),
    log_lead_follow_up: (args: any) => runTool("log_lead_follow_up", args, ctx),
    schedule_trial: (args: any) => runTool("schedule_trial", args, ctx),
    log_event: (args: any) => runTool("log_event", args, ctx),
    detect_trial_to_enrollment: (args: any) => runTool("detect_trial_to_enrollment", args, ctx),
    create_enrollment: (args: any) => runTool("create_enrollment", args, ctx),
    plan_onboarding_sequence: (args: any) => runTool("plan_onboarding_sequence", args, ctx),
    send_onboarding_message: (args: any) => runTool("send_onboarding_message", args, ctx),
    update_student: (args: any) => runTool("update_student", args, ctx),
    detect_at_risk_students: (args: any) => runTool("detect_at_risk_students", args, ctx),
    plan_retention_sequence: (args: any) => runTool("plan_retention_sequence", args, ctx),
  };

  void ctx.tools.enqueue_task({
    agent: "dashboard",
    payload: { type: "dashboard_tick", intervalMs: 60_000 },
  });

  startAgentRuntime(ctx);
}

export const metadata: Metadata = {
  title: "Ziro Work — Agent Command Center",
  description: "AI-powered agent command center for Ziro Work",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body className="h-full bg-[#080808] text-[#d4d4d4] antialiased">
        {children}
      </body>
    </html>
  );
}
