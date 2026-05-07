import Link from "next/link";
import { resolveTeacherContext } from "./guard";
import { getTeacherDashboard } from "@/lib/teacher/service";
import { toTeacherDisplayProfile } from "@/lib/teacher/types";
import { logAudit } from "@/lib/audit/log";
import { getAssessmentDashboard } from "@/lib/assessments/service";
import { AssessmentList } from "@/app/(app)/assessments/components";
import { ScheduleList } from "./components/ScheduleList";
import { StudentList } from "./components/StudentList";
import { LessonNotesList } from "./components/LessonNotesList";
import { MessageList } from "./components/MessageList";

export const dynamic = "force-dynamic";

export default async function TeacherHomePage() {
  let ctx;
  try {
    ctx = await resolveTeacherContext();
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Unable to resolve teacher context.";
    return (
      <div className="mx-auto flex max-w-lg flex-col items-center gap-3 rounded-lg border border-[var(--z-border)] bg-[var(--z-surface)] p-8 text-center">
        <h1 className="text-lg font-semibold text-[var(--z-fg)]">
          Teacher profile not found
        </h1>
        <p className="text-sm text-[var(--z-muted)]">
          {message === "TEACHER_NOT_FOUND"
            ? "Your account does not have a linked teacher record yet. Please contact your studio administrator."
            : message === "FORBIDDEN"
              ? "You do not have access to this teacher."
              : message}
        </p>
      </div>
    );
  }

  const [data, assessmentDashboard] = await Promise.all([
    getTeacherDashboard(ctx.teacherId),
    getAssessmentDashboard(ctx.tenantId).catch(() => null),
  ]);
  await logAudit("teacher.dashboard.page.view", {
    teacherId: ctx.teacherId,
    tenantId: ctx.tenantId,
    userId: ctx.session.userId,
  });
  const profile = toTeacherDisplayProfile(data.teacher);

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6">
      <section className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold text-[var(--z-fg)]">
          Welcome back{profile ? `, ${profile.fullName.split(" ")[0]}` : ""}
        </h1>
        <p className="text-sm text-[var(--z-muted)]">
          Here is your teaching day at a glance.
        </p>
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Today" value={countToday(data.schedule)} suffix="lessons" />
        <StatCard label="This week" value={countThisWeek(data.schedule)} suffix="lessons" />
        <StatCard label="Active students" value={data.students.filter((s) => s.status === "active").length} suffix="students" />
        <StatCard label="Recent notes" value={data.lessons.length} suffix="entries" />
      </section>

      <div id="schedule" className="scroll-mt-20">
        <ScheduleList
          schedule={data.schedule}
          title="Today's schedule"
          onlyToday
          maxRows={12}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div id="students" className="scroll-mt-20">
          <StudentList students={data.students} maxRows={15} />
        </div>
        <div id="messages" className="scroll-mt-20">
          <MessageList messages={data.messages} maxRows={10} />
        </div>
      </div>

      <div id="lessons" className="scroll-mt-20">
        <LessonNotesList
          lessons={data.lessons}
          students={data.students}
          maxRows={10}
        />
      </div>

      {assessmentDashboard ? (
        <section id="assessments" className="scroll-mt-20 rounded-lg border border-[var(--z-border)] bg-[var(--z-surface)]">
          <header className="flex items-center justify-between border-b border-[var(--z-border)] px-4 py-3">
            <div>
              <h2 className="text-sm font-semibold text-[var(--z-fg)]">
                Assessments
              </h2>
              <p className="text-xs text-[var(--z-muted)]">
                {assessmentDashboard.kpis.totalAssessments} assessments ·{" "}
                {assessmentDashboard.kpis.totalAttempts} attempts ·{" "}
                {assessmentDashboard.kpis.averageScorePct}% avg
              </p>
            </div>
            <Link
              href="/assessments"
              className="text-xs font-medium text-[#c4f036] hover:underline"
            >
              Open assessments OS →
            </Link>
          </header>
          <div className="p-4">
            <AssessmentList
              summaries={assessmentDashboard.assessments.slice(0, 8)}
              canWrite
            />
          </div>
        </section>
      ) : null}

      <section className="rounded-lg border border-[var(--z-border)] bg-[var(--z-surface)]">
        <header className="border-b border-[var(--z-border)] px-4 py-3">
          <h2 className="text-sm font-semibold text-[var(--z-fg)]">
            Upcoming schedule
          </h2>
        </header>
        <div className="p-4">
          <ScheduleList
            schedule={data.schedule.filter((b) => !isBeforeToday(b.block_date))}
            title="Next 14 days"
            maxRows={20}
          />
        </div>
      </section>
    </div>
  );
}

function StatCard({
  label,
  value,
  suffix,
}: {
  label: string;
  value: number;
  suffix: string;
}) {
  return (
    <div className="rounded-lg border border-[var(--z-border)] bg-[var(--z-surface)] p-4">
      <div className="text-xs font-semibold uppercase tracking-wider text-[var(--z-muted)]">
        {label}
      </div>
      <div className="mt-1 flex items-baseline gap-1.5">
        <span className="text-2xl font-semibold text-[var(--z-fg)]">
          {value}
        </span>
        <span className="text-xs text-[var(--z-muted)]">{suffix}</span>
      </div>
    </div>
  );
}

function countToday(
  schedule: { block_date?: string | null; status?: string | null }[],
): number {
  const today = new Date().toISOString().slice(0, 10);
  return schedule.filter(
    (b) => b.block_date === today && b.status !== "cancelled",
  ).length;
}

function countThisWeek(
  schedule: { block_date?: string | null; status?: string | null }[],
): number {
  const now = new Date();
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - start.getDay());
  const end = new Date(start);
  end.setDate(end.getDate() + 7);
  return schedule.filter((b) => {
    if (!b.block_date || b.status === "cancelled") return false;
    const d = new Date(`${b.block_date}T00:00:00`);
    return d >= start && d < end;
  }).length;
}

function isBeforeToday(date: string | null | undefined): boolean {
  if (!date) return true;
  const today = new Date().toISOString().slice(0, 10);
  return date < today;
}
