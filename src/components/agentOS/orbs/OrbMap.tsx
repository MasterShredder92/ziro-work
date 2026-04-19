"use client";

import * as React from "react";
import { AgentOrb } from "./AgentOrb";
import { EntityOrb } from "./EntityOrb";

export type OrbMapStudent = {
  id: string;
  name: string;
  familyIds?: string[];
};

export type OrbMapFamily = {
  id: string;
  name: string;
};

export type OrbMapTeacher = {
  id: string;
  name: string;
  studentIds: string[];
};

export type OrbMapProps = {
  teachers: OrbMapTeacher[];
  students: OrbMapStudent[];
  families: OrbMapFamily[];
  /** Agent ids whose orbs should appear in the top-right cluster. */
  agentIds?: string[];
  /** Called when a student orb is dropped onto a teacher orb. */
  onReassignStudent?: (studentId: string, toTeacherId: string) => void;
  /** Called when a student orb is clicked. */
  onStudentClick?: (studentId: string) => void;
  /** Called when a teacher orb is clicked. */
  onTeacherClick?: (teacherId: string) => void;
  className?: string;
};

/**
 * OrbMap — spatial layout:
 *   Teachers at center
 *   Students orbit the teacher they're assigned to
 *   Families orbit each of their student(s)
 *   Agents cluster in the top-right corner
 *
 * Pure CSS layout (no canvas) — SVG is only used for the connecting lines.
 * The snap-to-grid behavior is achieved by `grid-auto-flow` on teacher rows.
 */
export function OrbMap({
  teachers,
  students,
  families,
  agentIds = [],
  onReassignStudent,
  onStudentClick,
  onTeacherClick,
  className,
}: OrbMapProps) {
  const studentById = React.useMemo(() => {
    const map = new Map<string, OrbMapStudent>();
    students.forEach((s) => map.set(s.id, s));
    return map;
  }, [students]);

  const familyById = React.useMemo(() => {
    const map = new Map<string, OrbMapFamily>();
    families.forEach((f) => map.set(f.id, f));
    return map;
  }, [families]);

  const handleTeacherDrop =
    (teacherId: string) =>
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      const raw = e.dataTransfer.getData("application/x-ziro-orb");
      if (!raw) return;
      try {
        const payload = JSON.parse(raw) as { kind?: string; id?: string };
        if (payload.kind === "student" && typeof payload.id === "string") {
          onReassignStudent?.(payload.id, teacherId);
        }
      } catch {
        /* ignore */
      }
    };

  return (
    <div
      className={
        "relative w-full rounded-[var(--z-radius-lg)] border border-[var(--z-border)] bg-[var(--z-surface)] p-6 " +
        (className ?? "")
      }
    >
      {/* Agents cluster (top-right) */}
      {agentIds.length > 0 ? (
        <div className="absolute right-4 top-4 flex flex-wrap items-center justify-end gap-2">
          {agentIds.map((id) => (
            <AgentOrb key={id} agentId={id} size="lg" showRing={false} />
          ))}
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-2 xl:grid-cols-3">
        {teachers.map((teacher) => {
          const teacherStudents = teacher.studentIds
            .map((sid) => studentById.get(sid))
            .filter((s): s is OrbMapStudent => !!s);

          return (
            <div
              key={teacher.id}
              className="relative flex flex-col items-center gap-6"
            >
              {/* Teacher (center) */}
              <div className="flex flex-col items-center gap-2">
                <EntityOrb
                  kind="teacher"
                  id={teacher.id}
                  label={teacher.name}
                  onClick={() => onTeacherClick?.(teacher.id)}
                  draggable={false}
                  onDrop={handleTeacherDrop(teacher.id)}
                  onDragOver={(e) => e.preventDefault()}
                />
                <div className="text-xs font-semibold text-[var(--z-fg)]">{teacher.name}</div>
                <div className="text-[10px] uppercase tracking-[0.14em] text-[var(--z-muted)]">
                  Teacher · {teacherStudents.length} students
                </div>
              </div>

              {/* Students (orbit teacher) */}
              <div className="flex flex-wrap items-start justify-center gap-5">
                {teacherStudents.length === 0 ? (
                  <div className="rounded-[var(--z-radius-md)] border border-dashed border-[var(--z-border)] px-3 py-2 text-[11px] text-[var(--z-muted)]">
                    Drop students here
                  </div>
                ) : null}

                {teacherStudents.map((student) => {
                  const studentFamilies = (student.familyIds ?? [])
                    .map((fid) => familyById.get(fid))
                    .filter((f): f is OrbMapFamily => !!f);
                  return (
                    <div key={student.id} className="flex flex-col items-center gap-2">
                      <EntityOrb
                        kind="student"
                        id={student.id}
                        label={student.name}
                        onClick={() => onStudentClick?.(student.id)}
                      />
                      <div className="max-w-[96px] truncate text-center text-[11px] text-[var(--z-fg)]">
                        {student.name}
                      </div>
                      {/* Families (orbit student) */}
                      {studentFamilies.length > 0 ? (
                        <div className="flex flex-wrap items-center justify-center gap-1.5">
                          {studentFamilies.map((fam) => (
                            <EntityOrb
                              key={fam.id}
                              kind="family"
                              id={fam.id}
                              label={fam.name}
                              draggable={false}
                            />
                          ))}
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {teachers.length === 0 ? (
        <div className="py-10 text-center text-sm text-[var(--z-muted)]">
          No teachers to map yet.
        </div>
      ) : null}
    </div>
  );
}
