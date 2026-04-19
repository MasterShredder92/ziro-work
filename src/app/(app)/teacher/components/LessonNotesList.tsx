import type { SessionLog, Student } from "@/lib/types/entities";

interface LessonNotesListProps {
  lessons: SessionLog[];
  students?: Student[];
  title?: string;
  maxRows?: number;
}

function formatDateLabel(date: string | null | undefined): string {
  if (!date) return "--";
  const d = new Date(`${date}T00:00:00`);
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function studentLookup(students: Student[] | undefined): Map<string, Student> {
  const map = new Map<string, Student>();
  if (!students) return map;
  for (const s of students) map.set(s.id, s);
  return map;
}

function studentName(s?: Student): string {
  if (!s) return "Student";
  const row = s as unknown as Record<string, unknown>;
  const first = (row["first_name"] as string | undefined) ?? "";
  const last = (row["last_name"] as string | undefined) ?? "";
  const name = `${first} ${last}`.trim();
  if (name) return name;
  return (row["preferred_name"] as string | undefined) ?? s.id;
}

export function LessonNotesList({
  lessons,
  students,
  title = "Recent Lesson Notes",
  maxRows = 10,
}: LessonNotesListProps) {
  const rows = lessons.slice(0, maxRows);
  const index = studentLookup(students);
  return (
    <section className="rounded-lg border border-[var(--z-border)] bg-[var(--z-surface)]">
      <header className="flex items-center justify-between border-b border-[var(--z-border)] px-4 py-3">
        <h2 className="text-sm font-semibold text-[var(--z-fg)]">{title}</h2>
        <span className="text-xs text-[var(--z-muted)]">
          {rows.length} {rows.length === 1 ? "entry" : "entries"}
        </span>
      </header>
      {rows.length === 0 ? (
        <div className="px-4 py-8 text-center text-sm text-[var(--z-muted)]">
          No lesson notes yet.
        </div>
      ) : (
        <ul className="divide-y divide-[var(--z-border)]">
          {rows.map((l) => {
            const student = l.student_id ? index.get(l.student_id) : undefined;
            const note =
              (l["lesson_notes"] as string | undefined) ??
              (l["teacher_note"] as string | undefined) ??
              (l["ai_summary"] as string | undefined) ??
              "";
            const workedOn = (l["worked_on"] as string[] | null) ?? [];
            return (
              <li key={l.id} className="flex flex-col gap-2 px-4 py-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-[var(--z-fg)]">
                      {studentName(student)}
                    </span>
                    <span className="text-xs text-[var(--z-muted)]">
                      {formatDateLabel(l.block_date)}
                      {l.instrument ? ` · ${l.instrument}` : ""}
                      {typeof l.engagement_level === "number"
                        ? ` · Engagement ${l.engagement_level}/5`
                        : ""}
                    </span>
                  </div>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                      l.status === "completed"
                        ? "bg-emerald-500/10 text-emerald-400"
                        : l.status === "missed"
                          ? "bg-red-500/10 text-red-400"
                          : "bg-white/[0.05] text-[var(--z-fg)]"
                    }`}
                  >
                    {l.status ?? "logged"}
                  </span>
                </div>
                {note ? (
                  <p className="text-sm text-[var(--z-fg)]/90 whitespace-pre-wrap">
                    {note}
                  </p>
                ) : null}
                {workedOn.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {workedOn.map((tag, i) => (
                      <span
                        key={`${l.id}-wo-${i}`}
                        className="rounded-full bg-white/[0.05] px-2 py-0.5 text-[10px] text-[var(--z-fg)]/80"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
