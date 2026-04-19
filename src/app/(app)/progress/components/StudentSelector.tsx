import Link from "next/link";
import type { Student } from "@/lib/types/entities";
import type { StudentProgressSummary } from "@/lib/progress/types";

function name(student: Student): string {
  const row = student as unknown as Record<string, unknown>;
  const first = typeof row["first_name"] === "string" ? (row["first_name"] as string) : "";
  const last = typeof row["last_name"] === "string" ? (row["last_name"] as string) : "";
  const full = `${first} ${last}`.trim();
  return full.length > 0 ? full : (student.id.slice(0, 8) ?? "Student");
}

function instrument(student: Student): string | null {
  const row = student as unknown as Record<string, unknown>;
  const val = row["instrument"];
  return typeof val === "string" ? val : null;
}

export function StudentSelector({
  students,
  summaries,
  selectedStudentId,
}: {
  students: Student[];
  summaries: StudentProgressSummary[];
  selectedStudentId?: string | null;
}) {
  const summaryMap = new Map(summaries.map((s) => [s.studentId, s] as const));

  if (students.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-[var(--z-border)] p-6 text-sm text-[var(--z-muted)] text-center">
        No students found for this workspace yet.
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-[var(--z-border)] bg-[var(--z-surface)]">
      <header className="border-b border-[var(--z-border)] px-4 py-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-[var(--z-fg)]">Students</h2>
        <span className="text-xs text-[var(--z-muted)]">
          {students.length} total
        </span>
      </header>
      <ul className="divide-y divide-[var(--z-border)] max-h-[520px] overflow-y-auto">
        {students.slice(0, 200).map((student) => {
          const summary = summaryMap.get(student.id);
          const href = `/progress/${student.id}`;
          const isSelected = selectedStudentId === student.id;
          return (
            <li
              key={student.id}
              className={`px-4 py-3 ${isSelected ? "bg-[#00ff88]/10" : ""}`}
            >
              <Link
                href={href}
                className="flex items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium text-[var(--z-fg)]">
                    {name(student)}
                  </div>
                  <div className="truncate text-xs text-[var(--z-muted)]">
                    {instrument(student) ?? "—"}
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0 text-xs text-[var(--z-muted)]">
                  {summary ? (
                    <>
                      <span title="Goals completed">
                        {summary.kpis.goalsCompleted}/{summary.kpis.totalGoals}{" "}
                        goals
                      </span>
                      <span title="Skills mastered">
                        {summary.kpis.skillsMastered}/{summary.kpis.totalSkills}{" "}
                        skills
                      </span>
                    </>
                  ) : (
                    <span>—</span>
                  )}
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
