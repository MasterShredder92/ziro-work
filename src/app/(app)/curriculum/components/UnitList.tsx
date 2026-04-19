import type { Unit } from "@/lib/curriculum";

export function UnitList({
  units,
  emptyMessage = "No units yet.",
}: {
  units: Unit[];
  emptyMessage?: string;
}) {
  if (units.length === 0) {
    return (
      <div className="rounded-[var(--z-radius-md)] border border-dashed border-[var(--z-border)] bg-[var(--z-surface)] p-4 text-center text-xs text-[var(--z-muted)]">
        {emptyMessage}
      </div>
    );
  }

  return (
    <ul className="space-y-1.5">
      {units.map((unit) => (
        <li
          key={unit.id}
          className="rounded-[var(--z-radius-md)] border border-[var(--z-border)] bg-[var(--z-surface)] px-3 py-2"
        >
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <div className="text-sm font-semibold text-[var(--z-fg)] truncate">
                {unit.name}
              </div>
              {unit.description ? (
                <div className="text-xs text-[var(--z-muted)] line-clamp-2">
                  {unit.description}
                </div>
              ) : null}
            </div>
            {typeof unit.sort_order === "number" ? (
              <span className="shrink-0 text-[10px] text-[var(--z-muted)]">
                #{unit.sort_order}
              </span>
            ) : null}
          </div>
        </li>
      ))}
    </ul>
  );
}
