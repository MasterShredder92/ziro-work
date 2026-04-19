import type { ProgramSurface } from "@/lib/curriculum";
import { LessonList } from "./LessonList";
import { LevelList } from "./LevelList";
import { UnitList } from "./UnitList";

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[var(--z-radius-lg)] border border-[var(--z-border)] bg-[var(--z-surface)] px-4 py-3">
      <div className="text-[10px] uppercase tracking-wider text-[var(--z-muted)] font-semibold">
        {label}
      </div>
      <div className="mt-1 text-xl font-semibold text-[var(--z-fg)]">{value}</div>
    </div>
  );
}

export function ProgramDetail({ surface }: { surface: ProgramSurface }) {
  const { program, tree, kpis } = surface;

  return (
    <div className="space-y-6">
      <section className="space-y-2">
        <div className="text-[10px] uppercase tracking-wider text-[var(--z-muted)] font-semibold">
          {program.instrument ?? "Program"}
        </div>
        <h1 className="text-xl sm:text-2xl font-semibold text-[var(--z-fg)]">
          {program.name}
        </h1>
        {program.description ? (
          <p className="text-sm text-[var(--z-muted)]">{program.description}</p>
        ) : null}
      </section>

      <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat label="Levels" value={String(kpis.totalLevels)} />
        <Stat label="Units" value={String(kpis.totalUnits)} />
        <Stat label="Lessons" value={String(kpis.totalLessons)} />
        <Stat label="Materials" value={String(kpis.totalMaterials)} />
      </section>

      {tree.levels.length === 0 ? (
        <LevelList levels={[]} />
      ) : (
        <div className="space-y-8">
          {tree.levels.map((levelNode) => (
            <section key={levelNode.level.id} className="space-y-3">
              <header className="flex items-end justify-between gap-2 border-b border-[var(--z-border)] pb-1.5">
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-[var(--z-muted)] font-semibold">
                    Level
                  </div>
                  <h2 className="text-base font-semibold text-[var(--z-fg)]">
                    {levelNode.level.name}
                  </h2>
                </div>
                <div className="text-xs text-[var(--z-muted)]">
                  {levelNode.units.length} units
                </div>
              </header>
              {levelNode.units.length === 0 ? (
                <UnitList units={[]} />
              ) : (
                <div className="space-y-5">
                  {levelNode.units.map((unitNode) => (
                    <div key={unitNode.unit.id} className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <div className="text-sm font-semibold text-[var(--z-fg)]">
                          {unitNode.unit.name}
                        </div>
                        <div className="text-[10px] text-[var(--z-muted)]">
                          {unitNode.lessons.length} lessons
                        </div>
                      </div>
                      <LessonList
                        lessons={unitNode.lessons.map((l) => l.lesson)}
                        emptyMessage="No lessons in this unit yet."
                      />
                    </div>
                  ))}
                </div>
              )}
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
