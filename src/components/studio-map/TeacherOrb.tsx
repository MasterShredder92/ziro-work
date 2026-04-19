"use client";

import * as React from "react";
import type { StudentStatus } from "@/lib/data/models/students";
import { cn, focusRingClassName } from "@/components/ui/utils";
import { StudentOrb } from "./StudentOrb";
import { InactiveClusterOrb } from "./InactiveClusterOrb";

type StudioMapTeacher = {
  id: string;
  name?: string | null;
  first_name?: string | null;
  last_name?: string | null;
};

type StudioMapStudent = {
  id: string;
  name: string;
  status: string | null;
};

export type TeacherOrbProps = {
  teacher: StudioMapTeacher;
  studentCount: number;
  expanded: boolean;
  onExpand: () => void;
  students?: StudioMapStudent[];
  studentsLoading?: boolean;
  className?: string;
};

function teacherName(teacher: StudioMapTeacher): string {
  const explicit = (teacher.name ?? "").trim();
  if (explicit) return explicit;
  const first = (teacher.first_name ?? "").trim();
  const last = (teacher.last_name ?? "").trim();
  return `${first} ${last}`.trim() || "Teacher";
}

export function TeacherOrb({
  teacher,
  studentCount,
  expanded,
  onExpand,
  students,
  studentsLoading,
  className,
}: TeacherOrbProps) {
  const displayName = teacherName(teacher);
  const activeStudents = React.useMemo(
    () => (students ?? []).filter((s) => s.status === "active"),
    [students],
  );
  const inactiveStudents = React.useMemo(
    () => (students ?? []).filter((s) => s.status !== "active"),
    [students],
  );

  return (
    <div className={cn("flex flex-col items-center gap-[var(--z-space-3)]", className)}>
      <button
        type="button"
        onClick={onExpand}
        className={cn(
          "teacher-orb-magnet group flex flex-col items-center gap-[var(--z-space-2)] rounded-[var(--z-radius-lg)] border border-[var(--z-border)] bg-[var(--z-surface)] px-[var(--z-space-4)] py-[var(--z-space-3)] text-center",
          focusRingClassName(),
          "hover:border-[color-mix(in_oklab,var(--z-accent-color),transparent_45%)]",
        )}
      >
        <span
          className={cn(
            "flex h-12 w-12 items-center justify-center rounded-full border text-sm font-bold tracking-tight",
            "border-[var(--z-border)] bg-[var(--z-surface-2)] text-[var(--z-accent-color)]",
            "transition-[transform,box-shadow,border-color] duration-[var(--z-duration-medium)] [transition-timing-function:var(--z-ease-spring)]",
            "group-hover:scale-[1.08] group-hover:border-[color-mix(in_oklab,var(--z-accent-color),transparent_35%)]",
            "group-hover:shadow-[0_0_0_1px_color-mix(in_oklab,var(--z-accent-color),transparent_72%),0_0_26px_color-mix(in_oklab,var(--z-accent-color),transparent_78%)]",
          )}
          aria-hidden
        >
          {displayName
            .split(/\s+/)
            .filter(Boolean)
            .slice(0, 2)
            .map((p) => p[0]?.toUpperCase())
            .join("") || "?"}
        </span>
        <span className="max-w-[9rem] truncate text-xs font-semibold text-[var(--z-fg)]">
          {displayName}
        </span>
        <span className="text-[0.65rem] font-medium uppercase tracking-[0.14em] text-[var(--z-muted)]">
          {studentCount} students
        </span>
      </button>

      <div
        className={cn(
          "z-teacher-cluster w-full max-w-[min(100%,36rem)] overflow-hidden",
          expanded ? "max-h-[2000px] opacity-100" : "max-h-0 opacity-0",
        )}
        style={{
          transitionProperty: "max-height, opacity",
          transitionDuration: "var(--z-duration-medium), var(--z-duration-fast)",
          transitionTimingFunction: "var(--z-ease-spring), var(--z-ease-smooth)",
        }}
        aria-hidden={!expanded}
      >
        <div className="flex flex-col items-center gap-[var(--z-space-4)] pt-[var(--z-space-2)]">
          {studentsLoading ? (
            <div className="text-xs font-medium text-[var(--z-muted)]">Loading roster…</div>
          ) : students ? (
            students.length === 0 ? (
              <div className="text-xs text-[var(--z-muted)]">No students on this roster.</div>
            ) : (
              <>
                <div className="flex flex-wrap justify-center gap-[var(--z-space-3)]">
                  {activeStudents.map((s) => (
                    <StudentOrb key={s.id} student={s} status={s.status as StudentStatus} />
                  ))}
                </div>
                <InactiveClusterOrb
                  count={inactiveStudents.length}
                  students={inactiveStudents.map((s) => ({
                    id: s.id,
                    name: s.name,
                    status: s.status as StudentStatus,
                  }))}
                />
              </>
            )
          ) : null}
        </div>
      </div>
    </div>
  );
}
