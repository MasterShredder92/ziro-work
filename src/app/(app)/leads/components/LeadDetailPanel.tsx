import type { LeadDetail, LeadDisplayProfile } from "@/lib/leads/types";

export interface LeadDetailPanelProps {
  detail: LeadDetail;
  profile: LeadDisplayProfile;
}

function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function Field({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="rounded-[var(--z-radius-md)] border border-[var(--z-border)] bg-[var(--z-surface-2)] px-3 py-2.5">
      <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--z-muted)]">
        {label}
      </div>
      <div className="mt-1 text-sm font-medium text-[var(--z-fg)] break-words">
        {value === null || value === undefined || value === ""
          ? "—"
          : value}
      </div>
    </div>
  );
}

export function LeadDetailPanel({ detail, profile }: LeadDetailPanelProps) {
  const { lead, family, convertedStudent } = detail;
  const row = lead as unknown as Record<string, unknown>;

  return (
    <section className="rounded-[var(--z-radius-lg)] border border-[var(--z-border)] bg-[var(--z-surface)] p-5 space-y-5">
      <header className="flex items-start gap-4">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#00ff88]/15 text-[#00ff88] text-lg font-semibold border border-[#00ff88]/30">
          {profile.initials}
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[10px] uppercase tracking-wider text-[var(--z-muted)] font-semibold">
            Lead
          </div>
          <h2 className="text-xl font-semibold text-[var(--z-fg)] truncate">
            {profile.fullName}
          </h2>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-[var(--z-muted)]">
            <span className="rounded-full border border-[var(--z-border)] bg-[var(--z-surface-2)] px-2 py-0.5 capitalize">
              {profile.stage}
            </span>
            {profile.source ? (
              <span className="rounded-full border border-[var(--z-border)] bg-[var(--z-surface-2)] px-2 py-0.5">
                {profile.source}
              </span>
            ) : null}
            {profile.instrument ? (
              <span className="rounded-full border border-[var(--z-border)] bg-[var(--z-surface-2)] px-2 py-0.5">
                {profile.instrument}
              </span>
            ) : null}
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label="Email" value={profile.email ?? "—"} />
        <Field label="Phone" value={profile.phone ?? "—"} />
        <Field
          label="Parent"
          value={(row.parent_name as string | null | undefined) ?? "—"}
        />
        <Field
          label="Student name"
          value={(row.student_name as string | null | undefined) ?? "—"}
        />
        <Field
          label="Age"
          value={(row.age as string | null | undefined) ?? "—"}
        />
        <Field
          label="Experience"
          value={(row.experience as string | null | undefined) ?? "—"}
        />
        <Field
          label="Preferred times"
          value={(row.preferred_times as string | null | undefined) ?? "—"}
        />
        <Field
          label="How heard"
          value={(row.how_heard as string | null | undefined) ?? "—"}
        />
        <Field
          label="Assigned to"
          value={(row.assigned_to as string | null | undefined) ?? "—"}
        />
        <Field
          label="Assigned teacher"
          value={(row.assigned_teacher_id as string | null | undefined) ?? "—"}
        />
        <Field label="Created" value={formatDate(lead.created_at)} />
        <Field label="Updated" value={formatDate(lead.updated_at)} />
      </div>

      {typeof row.goals === "string" && (row.goals as string).length > 0 ? (
        <div className="rounded-[var(--z-radius-md)] border border-[var(--z-border)] bg-[var(--z-surface-2)] p-3">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--z-muted)]">
            Goals
          </div>
          <p className="mt-1 text-sm text-[var(--z-fg)] whitespace-pre-wrap">
            {row.goals as string}
          </p>
        </div>
      ) : null}

      {typeof row.notes === "string" && (row.notes as string).length > 0 ? (
        <div className="rounded-[var(--z-radius-md)] border border-[var(--z-border)] bg-[var(--z-surface-2)] p-3">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--z-muted)]">
            Notes
          </div>
          <p className="mt-1 text-sm text-[var(--z-fg)] whitespace-pre-wrap">
            {row.notes as string}
          </p>
        </div>
      ) : null}

      {family ? (
        <div className="rounded-[var(--z-radius-md)] border border-[var(--z-border)] bg-[var(--z-surface-2)] p-3 text-sm">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--z-muted)]">
            Linked family
          </div>
          <div className="mt-1 font-medium text-[var(--z-fg)]">
            {(family as unknown as { name?: string }).name ?? family.id}
          </div>
        </div>
      ) : null}

      {convertedStudent ? (
        <div className="rounded-[var(--z-radius-md)] border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-emerald-300">
            Converted
          </div>
          <div className="mt-1 font-medium text-emerald-100">
            Student {(convertedStudent as unknown as { first_name?: string }).first_name ?? ""}{" "}
            {(convertedStudent as unknown as { last_name?: string }).last_name ?? ""}
          </div>
        </div>
      ) : null}
    </section>
  );
}
