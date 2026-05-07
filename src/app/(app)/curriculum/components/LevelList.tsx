import type { Level } from "@/lib/curriculum";

export function LevelList({
  levels,
  emptyMessage = "No levels yet.",
}: {
  levels: Level[];
  emptyMessage?: string;
}) {
  if (levels.length === 0) {
    return (
      <div className="rounded-[var(--z-radius-lg)] border border-dashed border-[var(--z-border)] bg-[var(--z-surface)] p-6 text-center text-xs text-[var(--z-muted)]">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
      {levels.map((level) => (
        <div
          key={level.id}
          className="rounded-[var(--z-radius-md)] border border-[var(--z-border)] bg-[var(--z-surface)] px-3 py-2.5"
        >
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              {level.code ? (
                <div className="text-[10px] uppercase tracking-wider text-[var(--z-muted)] font-semibold">
                  {level.code}
                </div>
              ) : null}
              <div className="text-sm font-semibold text-[var(--z-fg)] truncate">
                {level.name}
              </div>
            </div>
            <span
              className={
                "text-[10px] rounded-full px-1.5 py-0.5 border " +
                (level.is_active
                  ? "border-[#c4f036]/30 text-[#c4f036]"
                  : "border-[var(--z-border)] text-[var(--z-muted)]")
              }
            >
              {level.is_active ? "active" : "draft"}
            </span>
          </div>
          {level.description ? (
            <div className="mt-1 text-xs text-[var(--z-muted)] line-clamp-2">
              {level.description}
            </div>
          ) : null}
        </div>
      ))}
    </div>
  );
}
