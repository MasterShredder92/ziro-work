import { resolveStudentContext } from "./guard";
import { getStudentDashboard } from "@/lib/student/service";
import { toStudentDisplayProfile } from "@/lib/student/types";
import { logAudit } from "@/lib/audit/log";
import { getStudentAssessmentSummary } from "@/lib/assessments/service";
import { canForRole } from "@/lib/auth/permissions";
import {
  AssessmentsSection,
  BillingList,
  LessonList,
  MessageList,
  ScheduleList,
} from "./components";

export const dynamic = "force-dynamic";

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function isBeforeToday(date: string | null): boolean {
  if (!date) return true;
  return date < todayIso();
}

export default async function StudentHomePage() {
  let ctx;
  try {
    ctx = await resolveStudentContext();
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Unable to resolve student context.";
    return (
      <div className="mx-auto flex max-w-lg flex-col items-center gap-3 rounded-lg border border-[var(--z-border)] bg-[var(--z-surface)] p-8 text-center">
        <h1 className="text-lg font-semibold text-[var(--z-fg)]">
          Student profile not found
        </h1>
        <p className="text-sm text-[var(--z-muted)]">
          {message === "STUDENT_NOT_FOUND"
            ? "Your account is not yet connected to a student record. Please contact your studio administrator."
            : message === "FORBIDDEN"
              ? "You do not have access to this student."
              : message}
        </p>
      </div>
    );
  }

  const [data, assessmentSummary] = await Promise.all([
    getStudentDashboard(ctx.studentId),
    getStudentAssessmentSummary(ctx.studentId, ctx.tenantId).catch(() => null),
  ]);
  await logAudit("student.dashboard.page.view", {
    studentId: ctx.studentId,
    tenantId: ctx.tenantId,
    userId: ctx.session.userId,
  });

  const profile = toStudentDisplayProfile(data.student);
  const today = todayIso();
  const todaysSchedule = data.schedule.filter((b) => b.block_date === today);
  const upcomingSchedule = data.schedule.filter(
    (b) => !isBeforeToday(b.block_date),
  );

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold text-[var(--z-fg)] sm:text-2xl">
          Welcome back{profile ? `, ${profile.firstName}` : ""}
        </h1>
        <p className="text-sm text-[var(--z-muted)]">
          {profile?.instrument ? `${profile.instrument} · ` : ""}
          {profile?.teacherName ??
            "Your teacher will be assigned shortly."}
        </p>
      </header>

      <section id="schedule" className="flex flex-col gap-3 scroll-mt-20">
        <div className="flex items-baseline justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--z-muted)]">
            Today
          </h2>
          <span className="text-xs text-[var(--z-muted)]">
            {todaysSchedule.length} session
            {todaysSchedule.length === 1 ? "" : "s"}
          </span>
        </div>
        <ScheduleList
          schedule={
            todaysSchedule.length > 0
              ? todaysSchedule
              : upcomingSchedule.slice(0, 5)
          }
          emptyLabel="Nothing on the books today."
        />
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div id="lessons" className="flex flex-col gap-3 scroll-mt-20">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--z-muted)]">
            Recent lessons
          </h2>
          <LessonList lessons={data.lessons} maxRows={10} />
        </div>
        <div id="messages" className="flex flex-col gap-3 scroll-mt-20">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--z-muted)]">
            Messages
          </h2>
          <MessageList messages={data.messages} maxRows={10} />
        </div>
      </section>

      <section id="billing" className="flex flex-col gap-3 scroll-mt-20">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--z-muted)]">
          Billing
        </h2>
        <BillingList
          invoices={data.billing}
          summary={data.billingSummary}
          maxRows={10}
        />
      </section>

      {assessmentSummary ? (
        <section id="assessments" className="flex flex-col gap-3 scroll-mt-20">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--z-muted)]">
            Assessments
          </h2>
          <AssessmentsSection
            summary={assessmentSummary}
            canRun={canForRole(ctx.session.role, "assessments.run")}
          />
        </section>
      ) : null}

      <section className="rounded-lg border border-[var(--z-border)] bg-[var(--z-surface)]">
        <header className="border-b border-[var(--z-border)] px-4 py-3">
          <h2 className="text-sm font-semibold text-[var(--z-fg)]">
            Upcoming schedule
          </h2>
          <p className="text-xs text-[var(--z-muted)]">Next 14 days</p>
        </header>
        <div className="p-4">
          <ScheduleList
            schedule={upcomingSchedule}
            maxRows={20}
            emptyLabel="No upcoming sessions in the next two weeks."
          />
        </div>
      </section>
    </div>
  );
}
