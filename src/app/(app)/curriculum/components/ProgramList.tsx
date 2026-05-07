import Link from "next/link";
import type { Program } from "@/lib/curriculum";

export function ProgramList({
  programs,
  emptyMessage = "No programs yet.",
}: {
  programs: Program[];
  emptyMessage?: string;
}) {
  if (programs.length === 0) {
    return (
      <div className="rounded-[var(--z-radius-lg)] border border-dashed border-[var(--z-border)] bg-[var(--z-surface)] p-8 text-center">
        <div className="text-sm font-semibold text-[var(--z-fg)]">
          {emptyMessage}
        </div>
        <div className="mt-1 text-xs text-[var(--z-muted)]">
          Add a program to start mapping levels, units, and lessons.
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
      {programs.map((program) => (
        <Link
          key={program.id}
          href={`/curriculum/${program.id}`}
          className="group rounded-[var(--z-radius-lg)] border border-[var(--z-border)] bg-[var(--z-surface)] p-4 hover:border-[color-mix(in_oklab,var(--z-accent),transparent_45%)] transition-colors"
        >
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="text-[10px] uppercase tracking-wider text-[var(--z-muted)] font-semibold">
                {program.instrument ?? "Program"}
              </div>
              <div className="mt-1 text-base font-semibold text-[var(--z-fg)] truncate">
                {program.name}
              </div>
            </div>
            <span
              className={
                "text-[10px] font-semibold uppercase tracking-wider rounded-full px-2 py-0.5 border " +
                (program.is_active
                  ? "border-[#c4f036]/40 text-[#c4f036] bg-[#c4f036]/10"
                  : "border-[var(--z-border)] text-[var(--z-muted)] bg-[var(--z-surface-2)]")
              }
            >
              {program.is_active ? "Active" : "Draft"}
            </span>
          </div>
          {program.description ? (
            <div className="mt-2 text-xs text-[var(--z-muted)] line-clamp-2">
              {program.description}
            </div>
          ) : null}
          <div className="mt-3 flex items-center gap-3 text-xs text-[var(--z-muted)]">
            <span>{program.level_count ?? 0} levels</span>
            <span className="opacity-50">·</span>
            <span className="group-hover:text-[var(--z-accent)]">Open →</span>
          </div>
        </Link>
      ))}
    </div>
  );
}
