import type { LessonSurface } from "@/lib/curriculum";
import { MaterialList } from "./MaterialList";
import { StudentProgressList } from "./StudentProgressList";

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "default" | "success" | "warning";
}) {
  const toneClass =
    tone === "warning"
      ? "text-amber-300"
      : tone === "success"
        ? "text-[#c4f036]"
        : "text-[var(--z-fg)]";
  return (
    <div className="rounded-[var(--z-radius-lg)] border border-[var(--z-border)] bg-[var(--z-surface)] px-4 py-3">
      <div className="text-[10px] uppercase tracking-wider text-[var(--z-muted)] font-semibold">
        {label}
      </div>
      <div className={`mt-1 text-xl font-semibold ${toneClass}`}>{value}</div>
    </div>
  );
}

export function LessonDetail({ surface }: { surface: LessonSurface }) {
  const { lesson, unit, level, program } = surface;

  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <div className="text-[10px] uppercase tracking-wider text-[var(--z-muted)] font-semibold">
          Lesson
        </div>
        <h1 className="text-xl sm:text-2xl font-semibold text-[var(--z-fg)]">
          {lesson.title}
        </h1>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[var(--z-muted)]">
          {program ? <span>{program.name}</span> : null}
          {level ? <span>· {level.name}</span> : null}
          {unit ? <span>· {unit.name}</span> : null}
          {lesson.difficulty ? (
            <span className="uppercase tracking-wider">· {lesson.difficulty}</span>
          ) : null}
          {typeof lesson.estimated_minutes === "number" ? (
            <span>· {lesson.estimated_minutes}m</span>
          ) : null}
        </div>
        {lesson.objective ? (
          <div className="text-sm text-[var(--z-fg)]">{lesson.objective}</div>
        ) : null}
        {lesson.summary ? (
          <div className="text-sm text-[var(--z-muted)]">{lesson.summary}</div>
        ) : null}
      </section>

      <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat label="Materials" value={String(surface.kpis.totalMaterials)} />
        <Stat
          label="Students started"
          value={String(surface.kpis.studentsStarted)}
        />
        <Stat
          label="Completed"
          value={String(surface.kpis.studentsCompleted)}
          tone="success"
        />
        <Stat
          label="Needs review"
          value={String(surface.kpis.needsReview)}
          tone={surface.kpis.needsReview > 0 ? "warning" : "default"}
        />
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--z-muted)]">
          Materials
        </h2>
        <MaterialList materials={surface.materials} />
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--z-muted)]">
          Recent student progress
        </h2>
        <StudentProgressList completions={surface.recentCompletions} />
      </section>
    </div>
  );
}
