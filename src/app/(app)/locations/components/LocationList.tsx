import Link from "next/link";
import type { Location } from "@/lib/types/entities";

interface LocationListProps {
  locations: Location[];
}

export function LocationList({ locations }: LocationListProps) {
  if (locations.length === 0) {
    return (
      <div className="rounded-lg border border-[var(--z-border)] bg-[var(--z-surface)] p-8 text-center text-sm text-[var(--z-muted)]">
        No active locations configured yet.
      </div>
    );
  }
  return (
    <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {locations.map((loc) => (
        <li key={loc.id}>
          <Link
            href={`/locations/${loc.id}`}
            className="group flex h-full flex-col gap-2 rounded-lg border border-[var(--z-border)] bg-[var(--z-surface)] p-4 transition hover:border-[var(--z-accent)]"
          >
            <div className="flex items-center justify-between gap-2">
              <h3 className="truncate text-base font-semibold text-[var(--z-fg)]">
                {loc.name}
              </h3>
              {loc.is_active === false ? (
                <span className="rounded-full border border-[var(--z-border)] px-2 py-0.5 text-[10px] uppercase tracking-wide text-[var(--z-muted)]">
                  Inactive
                </span>
              ) : null}
            </div>
            <p className="truncate text-xs text-[var(--z-muted)]">
              {[loc.address, loc.city, loc.state, loc.zip]
                .filter(Boolean)
                .join(", ")}
            </p>
            <div className="mt-auto flex items-center justify-between text-xs text-[var(--z-muted)]">
              <span>
                {(loc.students_enrolled as number | null) ?? 0} enrolled
              </span>
              <span className="text-[var(--z-accent)] group-hover:underline">
                View dashboard →
              </span>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
