"use client";

import * as React from "react";
import type { Student } from "@/lib/data/models";
import type { StudentStatus } from "@/lib/data/models/students";
import { cn } from "@/components/ui/utils";
import { focusRingClassName } from "@/components/ui/utils";
import { StudentOrb } from "./StudentOrb";

export type InactiveClusterOrbProps = {
  count: number;
  students: Array<Pick<Student, "id" | "name"> & { status: StudentStatus }>;
  className?: string;
};

export function InactiveClusterOrb({ count, students, className }: InactiveClusterOrbProps) {
  const [open, setOpen] = React.useState(false);

  if (count <= 0) return null;

  return (
    <div className={cn("flex flex-col items-center gap-[var(--z-space-3)]", className)}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "flex flex-col items-center gap-[var(--z-space-2)] rounded-[var(--z-radius-lg)] border border-[var(--z-border)] bg-[var(--z-surface-2)] px-[var(--z-space-4)] py-[var(--z-space-3)] text-center transition-all hover:border-[color-mix(in_oklab,var(--z-accent),transparent_55%)] hover:shadow-[0_0_0_1px_color-mix(in_oklab,var(--z-accent),transparent_78%),0_0_18px_color-mix(in_oklab,var(--z-accent),transparent_90%)]",
          focusRingClassName(),
        )}
      >
        <span
          className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--z-border)] text-xs font-bold text-[var(--z-muted)]"
          aria-hidden
        >
          {count}
        </span>
        <span className="text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-[var(--z-muted)]">
          Inactive
        </span>
      </button>

      {open ? (
        <div className="flex max-w-[min(100%,28rem)] flex-wrap justify-center gap-[var(--z-space-3)]">
          {students.map((s) => (
            <StudentOrb key={s.id} student={s} status={s.status} />
          ))}
        </div>
      ) : null}
    </div>
  );
}
