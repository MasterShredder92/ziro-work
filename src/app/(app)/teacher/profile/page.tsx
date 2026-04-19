import Link from "next/link";
import {
  getTeacherSchedule,
  listEnrollmentsFor,
  summarizeTeacherScheduleHeadline,
} from "@/lib/crm";
import { resolveTeacherContext } from "../guard";
import type { Teacher as TeacherRow } from "@/lib/types/entities";

export const dynamic = "force-dynamic";

export default async function TeacherPortalProfilePage() {
  let ctx;
  try {
    ctx = await resolveTeacherContext();
  } catch {
    return (
      <div className="rounded-lg border border-[var(--z-border)] bg-[var(--z-surface)] p-6 text-sm text-[var(--z-muted)]">
        Your profile isn&apos;t available right now. Please contact your
        administrator.
      </div>
    );
  }

  const { tenantId, teacherId } = ctx;
  const teacher = ctx.teacher as unknown as TeacherRow;
  const [schedule, enrollments, scheduleHeadline] = await Promise.all([
    getTeacherSchedule(tenantId, teacherId),
    listEnrollmentsFor(tenantId, { teacher_id: teacherId }),
    summarizeTeacherScheduleHeadline(tenantId, teacherId),
  ]);

  const activeEnrollments = enrollments.filter((e) => e.status === "active");
  const weeklyLoadMinutes = schedule.reduce((sum, block) => {
    if (!block.startsAt || !block.endsAt) return sum;
    const [sh, sm] = block.startsAt.split(":").map(Number);
    const [eh, em] = block.endsAt.split(":").map(Number);
    const minutes = eh * 60 + em - (sh * 60 + sm);
    return sum + (isFinite(minutes) ? minutes : 0);
  }, 0);

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 p-2">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-[var(--z-fg)]">
            {teacher.first_name} {teacher.last_name}
          </h1>
          <p className="text-sm text-[var(--z-muted)]">
            Your profile, schedule, load, and assigned students.
          </p>
        </div>
        <Link
          href={`/messages?teacherId=${encodeURIComponent(teacherId)}`}
          className="rounded-md border border-[var(--z-border)] bg-[var(--z-surface)] px-3 py-1.5 text-sm font-medium text-[var(--z-fg)] hover:bg-[var(--z-muted)]/10"
        >
          Message center
        </Link>
      </header>

      <section className="grid gap-3 md:grid-cols-4">
        <Kpi label="Active students" value={activeEnrollments.length} />
        <Kpi label="Weekly blocks" value={schedule.length} />
        <Kpi
          label="Weekly hours"
          value={(weeklyLoadMinutes / 60).toFixed(1)}
        />
        <Kpi label="Status" value={teacher.status ?? "—"} />
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card title="Profile">
          <Row label="Email" value={teacher.email ?? null} />
          <Row label="Phone" value={teacher.phone ?? null} />
          <Row
            label="Instruments"
            value={(teacher.instruments ?? []).join(", ") || null}
          />
          <Row
            label="Hire date"
            value={(teacher.hire_date as string | null) ?? null}
          />
        </Card>

        <Card title="Availability">
          <div className="text-sm text-[var(--z-muted)]">
            Availability is managed from the scheduling module. Contact your
            administrator to update your recurring availability.
          </div>
        </Card>
      </section>

      {scheduleHeadline ? (
        <p className="text-sm text-[var(--z-muted)]">
          Next recurring block: {scheduleHeadline}
        </p>
      ) : null}

      <Card title="Schedule">
        {schedule.length === 0 ? (
          <div className="text-sm text-[var(--z-muted)]">
            No scheduled lessons this week.
          </div>
        ) : (
          <ul className="divide-y divide-[var(--z-border)] text-sm">
            {schedule.map((b) => (
              <li
                key={b.blockId}
                className="flex items-center justify-between py-2"
              >
                <span>{b.dayOfWeek ?? "—"}</span>
                <span className="text-[var(--z-muted)]">
                  {b.startsAt ?? "—"} → {b.endsAt ?? "—"}
                </span>
                <span className="text-[var(--z-muted)]">{b.status ?? "—"}</span>
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
