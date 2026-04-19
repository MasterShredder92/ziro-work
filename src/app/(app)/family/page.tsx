import { ensureFamilyAccess } from "./guard";
import {
  getFamilyProfile,
  resolveCurrentFamilyId,
} from "@/lib/family/queries";
import { getFamilyDashboard } from "@/lib/family/service";
import { toFamilyDisplayProfile } from "@/lib/family/types";
import { getStudentAssessmentSummary } from "@/lib/assessments/service";
import { AttemptList } from "@/app/(app)/assessments/components";
import {
  BillingList,
  MessageList,
  ScheduleList,
  StudentList,
} from "./components";

export const dynamic = "force-dynamic";

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function isoDaysAhead(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

export default async function FamilyDashboardPage() {
  const session = await ensureFamilyAccess();
  const familyId = await resolveCurrentFamilyId(
    session.userId,
    session.tenantId,
  );

  if (!familyId) {
    return (
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-3 p-6">
        <div className="rounded-lg border border-[var(--z-border)] bg-[var(--z-surface)] p-8 text-center">
          <h1 className="text-lg font-semibold text-[var(--z-fg)]">
            No family profile linked
          </h1>
          <p className="mt-2 text-sm text-[var(--z-muted)]">
            Your account isn&apos;t yet connected to a family record. Please
            contact your studio administrator.
          </p>
        </div>
      </div>
    );
  }

  const data = await getFamilyDashboard(familyId);
  const family = data.family ?? (await getFamilyProfile(session.userId));
  const profile = toFamilyDisplayProfile(family);

  const assessmentSummaries = await Promise.all(
    data.students.map((s) =>
      getStudentAssessmentSummary(s.id, session.tenantId).catch(() => null),
    ),
  );

  const today = todayIso();
  const windowEnd = isoDaysAhead(14);
  const upcoming14 = data.schedule.filter(
    (b) =>
      (b.block_date ?? "") >= today && (b.block_date ?? "") <= windowEnd,
  );

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
      <section className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold text-[var(--z-fg)]">
          Welcome{profile ? `, ${profile.familyName}` : ""}
        </h1>
        <p className="text-sm text-[var(--z-muted)]">
          {data.students.length} student
          {data.students.length === 1 ? "" : "s"} · {data.schedule.length}{" "}
          upcoming event{data.schedule.length === 1 ? "" : "s"}
        </p>
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Today"
          value={
            data.schedule.filter(
              (b) => b.block_date === today && b.status !== "cancelled",
            ).length
          }
          suffix="lessons"
        />
        <StatCard
          label="Next 14 days"
          value={upcoming14.length}
          suffix="lessons"
        />
        <StatCard
          label="Active students"
          value={data.students.filter((s) => s.status === "active").length}
          suffix="students"
        />
        <StatCard
          label="Open balance"
          value={`$${(data.billingSummary.balanceCents / 100).toFixed(2)}`}
        />
      </section>

      <div id="students" className="scroll-mt-20">
        <StudentList students={data.students} maxRows={20} />
      </div>

      <div id="schedule" className="scroll-mt-20">
        <ScheduleList
          schedule={data.schedule}
          title="Today's schedule"
          onlyToday
          maxRows={12}
          emptyLabel="No lessons today."
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div id="messages" className="scroll-mt-20">
          <MessageList messages={data.messages} maxRows={10} />
        </div>
        <div id="billing" className="scroll-mt-20">
          <BillingList
            invoices={data.billing}
            summary={data.billingSummary}
            title="Billing summary"
            maxRows={10}
          />
        </div>
      </div>

      {assessmentSummaries.some((s) => s && s.attempts.length > 0) ? (
        <section id="assessments" className="scroll-mt-20 rounded-lg border border-[var(--z-border)] bg-[var(--z-surface)]">
          <header className="border-b border-[var(--z-border)] px-4 py-3">
            <h2 className="text-sm font-semibold text-[var(--z-fg)]">
              Assessments
            </h2>
            <p className="text-xs text-[var(--z-muted)]">
              Recent attempts across {data.students.length} student
              {data.students.length === 1 ? "" : "s"}
            </p>
          </header>
          <div className="space-y-4 p-4">
            {assessmentSummaries.map((summary, i) => {
              if (!summary) return null;
              const student = data.students[i];
              if (!student) return null;
              const recent = summary.attempts.slice(0, 5);
              const displayName = student.display_name || student.id;
              return (
                <div key={student.id} className="space-y-2">
                  <div className="flex items-baseline justify-between">
                    <div className="text-sm font-semibold text-[var(--z-fg)]">
                      {displayName}
                    </div>
                    <div className="text-xs text-[var(--z-muted)]">
                      {summary.totals.completed} completed ·{" "}
                      {summary.totals.averageScorePct
                        ? `${summary.totals.averageScorePct}% avg`
                        : "—"}
                    </div>
                  </div>
                  <AttemptList attempts={recent} canGrade={false} />
                </div>
              );
            })}
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
            schedule={upcoming14}
            title="Next 14 days"
            maxRows={30}
            emptyLabel="Nothing scheduled in the next 14 days."
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
  value: number | string;
  suffix?: string;
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
        {suffix ? (
          <span className="text-xs text-[var(--z-muted)]">{suffix}</span>
        ) : null}
      </div>
    </div>
  );
}
