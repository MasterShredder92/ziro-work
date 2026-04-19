import { StudentTimeline } from "@/components/students/StudentTimeline";
import type { TimelineItem } from "@/lib/lifecycle/buildTimeline";

const demoEvents: TimelineItem[] = [
  {
    occurredAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
    type: "student_created",
    title: "Student created",
    payload: { student_id: "demo" },
  },
  {
    occurredAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4).toISOString(),
    type: "stage_transition",
    title: "Stage changed → scheduling",
    payload: { from: "lead-work", to: "scheduling" },
  },
  {
    occurredAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
    type: "agent.task.completed",
    title: "Agent task completed",
    payload: { task: "send_welcome" },
  },
  {
    occurredAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
    type: "invoice",
    title: "Invoice: open",
    payload: { status: "open", amount_cents: 12000 },
  },
  {
    occurredAt: new Date(Date.now() - 1000 * 60 * 60 * 20).toISOString(),
    type: "attendance.marked",
    title: "Attendance marked",
    payload: { present: true },
  },
  {
    occurredAt: new Date().toISOString(),
    type: "risk.signal",
    title: "Risk signal detected",
    payload: { reason: "inactivity" },
  },
];

export default function SandboxTimelinePage() {
  return (
    <div className="min-h-full bg-[var(--z-bg)] p-[var(--z-space-8)] text-[var(--z-fg)]">
      <div className="mx-auto max-w-3xl space-y-[var(--z-space-8)]">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--z-muted)]">Sandbox</div>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">Student timeline</h1>
        </div>
        <StudentTimeline events={demoEvents} />
      </div>
    </div>
  );
}
