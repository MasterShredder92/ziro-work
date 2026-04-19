"use client";

import { cn } from "@/components/ui/utils";
import { TeacherOrb } from "./TeacherOrb";

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

export type StudioMapTeacherSlot = {
  teacher: StudioMapTeacher;
  studentCount: number;
};

export type StudioMapClassicProps = {
  studioLabel?: string;
  teachers: StudioMapTeacherSlot[];
  expandedTeacherId: string | null;
  onTeacherToggle: (teacherId: string) => void;
  studentsForExpandedTeacher?: StudioMapStudent[] | null;
  expandedStudentsLoading?: boolean;
  className?: string;
};

/** Legacy flex layout — used by sandbox demos and animation QA. */
export function StudioMapClassic({
  studioLabel = "Studio",
  teachers,
  expandedTeacherId,
  onTeacherToggle,
  studentsForExpandedTeacher,
  expandedStudentsLoading,
  className,
}: StudioMapClassicProps) {
  return (
    <div
      className={cn(
        "flex w-full flex-col items-center gap-[var(--z-space-10)] px-[var(--z-space-4)] py-[var(--z-space-8)] sm:px-[var(--z-space-6)]",
        className,
      )}
    >
      <div className="flex flex-col items-center gap-[var(--z-space-3)]">
        <div
          className="relative flex h-28 w-28 items-center justify-center rounded-full border border-[color-mix(in_oklab,var(--z-accent-color),transparent_40%)] bg-[color-mix(in_oklab,var(--z-surface),var(--z-accent-color)_8%)] shadow-[0_0_0_1px_color-mix(in_oklab,var(--z-accent-color),transparent_75%),0_0_40px_color-mix(in_oklab,var(--z-accent-color),transparent_85%)] sm:h-32 sm:w-32"
          aria-label={studioLabel}
        >
          <span className="text-center text-sm font-extrabold uppercase tracking-[0.2em] text-[var(--z-accent-color)] sm:text-base">
            {studioLabel}
          </span>
        </div>
        <p className="max-w-sm text-center text-xs text-[var(--z-muted)]">
          Charcoal map · tap a teacher to reveal their roster
        </p>
      </div>

      <div className="flex w-full max-w-5xl flex-wrap items-start justify-center gap-x-[var(--z-space-8)] gap-y-[var(--z-space-10)]">
        {teachers.map(({ teacher, studentCount }, idx) => {
          const expanded = expandedTeacherId === teacher.id;
          return (
            <div
              key={teacher.id}
              className="z-studio-orb-enter"
              style={{ animationDelay: `${idx * 48}ms` }}
            >
              <TeacherOrb
                teacher={teacher}
                studentCount={studentCount}
                expanded={expanded}
                onExpand={() => onTeacherToggle(teacher.id)}
                students={expanded ? (studentsForExpandedTeacher ?? undefined) : undefined}
                studentsLoading={expanded ? expandedStudentsLoading : false}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
