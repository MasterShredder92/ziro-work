import type { Student } from "@/lib/types/entities";

interface StudentListProps {
  students: Student[];
  title?: string;
  maxRows?: number;
}

function studentName(s: Student): string {
  const row = s as unknown as Record<string, unknown>;
  const first = (row["first_name"] as string | undefined) ?? "";
  const last = (row["last_name"] as string | undefined) ?? "";
  const name = `${first} ${last}`.trim();
  if (name) return name;
  const preferred = (row["preferred_name"] as string | undefined) ?? "";
  return preferred || s.id;
}

function studentInstrument(s: Student): string {
  const row = s as unknown as Record<string, unknown>;
  return (row["instrument"] as string | undefined) ?? "--";
}

function studentInitials(s: Student): string {
  const row = s as unknown as Record<string, unknown>;
  const first = (row["first_name"] as string | undefined) ?? "";
  const last = (row["last_name"] as string | undefined) ?? "";
  const initials = (first[0] ?? "") + (last[0] ?? "");
  return initials.toUpperCase() || "S";
}

export function StudentList({
  students,
  title = "Students",
  maxRows = 25,
}: StudentListProps) {
  const rows = students.slice(0, maxRows);
  return (
    <section className="rounded-lg border border-[var(--z-border)] bg-[var(--z-surface)]">
      <header className="flex items-center justify-between border-b border-[var(--z-border)] px-4 py-3">
        <h2 className="text-sm font-semibold text-[var(--z-fg)]">{title}</h2>
        <span className="text-xs text-[var(--z-muted)]">
          {students.length} total
        </span>
      </header>
      {rows.length === 0 ? (
        <div className="px-4 py-8 text-center text-sm text-[var(--z-muted)]">
          No students assigned.
        </div>
      ) : (
        <ul className="divide-y divide-[var(--z-border)]">
          {rows.map((s) => (
            <li
              key={s.id}
              className="flex items-center justify-between gap-3 px-4 py-3"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/[0.06] text-xs font-semibold text-[var(--z-fg)]">
                  {studentInitials(s)}
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-[var(--z-fg)]">
                    {studentName(s)}
                  </span>
                  <span className="text-xs text-[var(--z-muted)]">
                    {studentInstrument(s)}
                    {(s as unknown as { enrollment_type?: string | null })
                      .enrollment_type
                      ? ` · ${(s as unknown as { enrollment_type?: string | null }).enrollment_type}`
                      : ""}
                  </span>
                </div>
              </div>
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                  s.status === "active"
                    ? "bg-emerald-500/10 text-emerald-400"
                    : s.status === "inactive"
                      ? "bg-red-500/10 text-red-400"
                      : "bg-white/[0.05] text-[var(--z-fg)]"
                }`}
              >
                {s.status ?? "unknown"}
              </span>
            </li>
          ))}
        </ul>
      )}
      {students.length > rows.length ? (
        <div className="border-t border-[var(--z-border)] px-4 py-2 text-xs text-[var(--z-muted)]">
          Showing {rows.length} of {students.length}
        </div>
      ) : null}
    </section>
  );
}
