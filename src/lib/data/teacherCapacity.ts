import type { Student, Teacher } from "./models";

export interface TeacherCapacityResult {
  teacherId: string;
  maxStudents: number | null;
  assignedStudents: number;
  remainingSlots: number | null;
  utilization: number | null; // 0..1
}

export function computeTeacherCapacity(input: {
  teacher: Teacher;
  students: Student[];
}): TeacherCapacityResult {
  const assignedStudents = input.students.filter(
    (s) => s.teacher_id === input.teacher.id && s.archived_at == null
  ).length;

  const maxStudents = input.teacher.max_students ?? null;
  const remainingSlots =
    typeof maxStudents === "number" ? Math.max(0, maxStudents - assignedStudents) : null;
  const utilization =
    typeof maxStudents === "number" && maxStudents > 0
      ? Math.min(1, assignedStudents / maxStudents)
      : null;

  return {
    teacherId: input.teacher.id,
    maxStudents,
    assignedStudents,
    remainingSlots,
    utilization,
  };
}

