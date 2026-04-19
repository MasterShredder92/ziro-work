import { AgentPanel } from "@/components/agent/AgentPanel";

export default function SandboxAgentPage() {
  return (
    <div className="min-h-full bg-[var(--z-bg)] p-[var(--z-space-8)] text-[var(--z-fg)]">
      <div className="mx-auto max-w-3xl space-y-[var(--z-space-8)]">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--z-muted)]">Sandbox</div>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">Agent panel</h1>
        </div>
        <AgentPanel
          agentName="Enrollment coordinator"
          avatarUrl={null}
          status="active"
          summary="Visual QA: active neon state, summary copy, and ordered next steps."
          nextActions={["Confirm trial attendance", "Send follow-up within 24h", "Update CRM notes"]}
          currentStageName="Lead work"
          blockers={["Missing lead record linked to this student."]}
        />
        <AgentPanel
          agentName="Retention"
          avatarUrl={null}
          status="blocked"
          summary="Visual QA: blocked state uses danger-tinted chrome while keeping charcoal surfaces."
          nextActions={["Resolve payment issue", "Schedule owner call"]}
          currentStageName="Retention"
          blockers={["Overdue invoice", "Negative sentiment event in last 30 days"]}
        />
      </div>
    </div>
  );
}
