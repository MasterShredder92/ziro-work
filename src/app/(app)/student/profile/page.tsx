import Link from "next/link";
import { getFamilyById } from "@data/families";
import {
  getNextLessonLabelsForStudents,
  getStudentSchedule,
  getStudentProgressSummary,
  listEnrollmentsFor,
} from "@/lib/crm";
import { resolveStudentContext } from "../guard";
import type { Family as FamilyRow } from "@/lib/types/entities";

export const dynamic = "force-dynamic";

export default async function StudentPortalProfilePage() {
  let ctx;
  try {
    ctx = await resolveStudentContext();
  } catch {
    return (
      <div className="rounded-lg border border-[var(--z-border)] bg-[var(--z-surface)] p-6 text-sm text-[var(--z-muted)]">
        Your profile isn&apos;t available right now. Please contact your
        administrator.
      </div>
    );
  }

  const { student, tenantId } = ctx;
  const [schedule, progress, enrollments, familyRaw, nextLessonMap] =
    await Promise.all([
      getStudentSchedule(tenantId, student.id),
      getStudentProgressSummary(tenantId, student.id),
      listEnrollmentsFor(tenantId, { student_id: student.id }),
      student.family_id ? getFamilyById(student.family_id, tenantId) : null,
      getNextLessonLabelsForStudents(tenantId, [student.id]),
    ]);
  const nextLesson = nextLessonMap[student.id];
  const family = (familyRaw ?? null) as FamilyRow | null;

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 p-2">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-[var(--z-fg)]">My profile</h1>
          <p className="text-sm text-[var(--z-muted)]">
            Read-only view of your information as your school has it on file.
          </p>
        </div>
        <Link
          href={`/schedule/student?studentId=${encodeURIComponent(student.id)}`}
          className="rounded-md border border-[var(--z-border)] bg-[var(--z-surface)] px-3 py-1.5 text-sm font-medium text-[var(--z-fg)] hover:bg-[var(--z-muted)]/10"
        >
          Open schedule
        </Link>
      </header>

      <section className="grid gap-3 md:grid-cols-4">
        <Kpi label="Sessions / month" value={student.sessions_per_month ?? 0} />
        <Kpi label="Blocks / week" value={student.blocks_per_week ?? 0} />
        <Kpi
          label="Goals"
          value={`${progress.completedGoals}/${progress.goalsCount}`}
        />
        <Kpi label="Skills tracked" value={progress.skillsCount} />
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card title="Profile">
          <Row label="Name" value={`${student.first_name} ${student.last_name}`} />
          <Row label="Email" value={student.email ?? null} />
          <Row label="Phone" value={student.phone ?? null} />
          <Row label="Instrument" value={student.instrument ?? null} />
          <Row
            label="Enrollment type"
            value={student.enrollment_type ?? null}
          />
          <Row label="Start date" value={student.start_date ?? null} />
          <Row label="Next lesson" value={nextLesson ?? null} />
        </Card>

        <Card title="Family">
          {family ? (
            <div className="space-y-2 text-sm">
              <div className="font-semibold text-[var(--z-fg)]">{family.name}</div>
              <div className="text-xs text-[var(--z-muted)]">
                {family.primary_email ?? "—"} · {family.primary_phone ?? "—"}
              </div>
            </div>
          ) : (
            <div className="text-sm text-[var(--z-muted)]">
              Not linked to a family.
            </div>
          )}
        </Card>
      </section>

      <Card title="Schedule">
        {schedule.length === 0 ? (
          <div className="text-sm text-[var(--z-muted)]">
            No scheduled lessons.
          </div>
        ) : (
          <ul className="divide-y divide-[var(--z-border)] text-sm">
            {schedule.map((s) => (
              <li
                key={s.blockId}
                className="flex items-center justify-between py-2"
              >
                <span>{s.dayOfWeek ?? "—"}</span>
                <span className="text-[var(--z-muted)]">
                  {s.startsAt ?? "—"} → {s.endsAt ?? "—"}
                </span>
                <span className="text-[var(--z-muted)]">{s.status ?? "—"}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card title="Enrollments">
        {enrollments.length === 0 ? (
          <div className="text-sm text-[var(--z-muted)]">
            No active enrollments.
          </div>
        ) : (
          <ul className="divide-y divide-[var(--z-border)] text-sm">
            {enrollments.map((e) => (
              <li
                key={e.id}
                className="flex items-center justify-between py-2"
              >
                <span>{e.status}</span>
                <span className="text-[var(--z-muted)]">
                  {e.start_date ?? "—"} → {e.end_date ?? "—"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

function Kpi({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-[var(--z-border)] bg-[var(--z-surface)] p-3">
      <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--z-muted)]">
        {label}
      </div>
      <div className="mt-1 text-xl font-semibold text-[var(--z-fg)]">
        {value}
      </div>
    </div>
  );
}

function Card({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-lg border border-[var(--z-border)] bg-[var(--z-surface)] p-4">
      <h3 className="mb-3 text-sm font-semibold text-[var(--z-fg)]">{title}</h3>
      {children}
    </section>
  );
}

function Row({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="flex items-center justify-between border-b border-[var(--z-border)] py-1.5 last:border-0 text-sm">
      <dt className="text-xs uppercase tracking-wider text-[var(--z-muted)]">
        {label}
      </dt>
      <dd className="text-[var(--z-fg)]">{value ?? "—"}</dd>
    </div>
  );
}
