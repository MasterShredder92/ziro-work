import Link from "next/link";
import type { Lesson } from "@/lib/curriculum";

export function LessonList({
  lessons,
  emptyMessage = "No lessons yet.",
}: {
  lessons: Lesson[];
  emptyMessage?: string;
}) {
  if (lessons.length === 0) {
    return (
      <div className="rounded-[var(--z-radius-md)] border border-dashed border-[var(--z-border)] bg-[var(--z-surface)] p-4 text-center text-xs text-[var(--z-muted)]">
        {emptyMessage}
      </div>
    );
  }

  return (
    <ul className="space-y-1.5">
      {lessons.map((lesson) => (
        <li key={lesson.id}>
          <Link
            href={`/curriculum/lesson/${lesson.id}`}
            className="flex items-center justify-between gap-3 rounded-[var(--z-radius-md)] border border-[var(--z-border)] bg-[var(--z-surface)] px-3 py-2 hover:border-[color-mix(in_oklab,var(--z-accent),transparent_45%)] transition-colors"
          >
            <div className="min-w-0">
              <div className="text-sm font-semibold text-[var(--z-fg)] truncate">
                {lesson.title}
              </div>
              {lesson.objective ? (
                <div className="text-xs text-[var(--z-muted)] line-clamp-1">
                  {lesson.objective}
                </div>
              ) : null}
            </div>
            <div className="shrink-0 flex items-center gap-2 text-[10px] text-[var(--z-muted)]">
              {lesson.difficulty ? (
                <span className="rounded-full border border-[var(--z-border)] px-1.5 py-0.5 uppercase tracking-wider">
                  {lesson.difficulty}
                </span>
              ) : null}
              {typeof lesson.estimated_minutes === "number" ? (
                <span>{lesson.estimated_minutes}m</span>
              ) : null}
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
