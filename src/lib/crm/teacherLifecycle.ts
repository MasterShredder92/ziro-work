import { createTeacher, updateTeacher } from "@data/teachers";
import type {
  Teacher,
  TeacherInsert,
  TeacherLifecycleStage,
} from "@/lib/types/crm";

const LEGAL_NEXT: Record<TeacherLifecycleStage, TeacherLifecycleStage[]> = {
  onboarding: ["active", "inactive"],
  active: ["inactive", "onboarding"],
  inactive: ["onboarding", "active"],
};

export function canTransition(
  from: TeacherLifecycleStage,
  to: TeacherLifecycleStage,
): boolean {
  return LEGAL_NEXT[from]?.includes(to) ?? false;
}

export async function onboardTeacher(
  tenantId: string,
  input: Omit<TeacherInsert, "tenant_id" | "status">,
): Promise<Teacher> {
  const row = await createTeacher(tenantId, {
    ...input,
    status: "onboarding",
    is_active: true,
  });
  return row as unknown as Teacher;
}

export async function setTeacherStage(
  tenantId: string,
  teacherId: string,
  stage: TeacherLifecycleStage,
): Promise<Teacher> {
  const patch: Parameters<typeof updateTeacher>[2] = {
    status: stage,
  };
  if (stage === "inactive") {
    patch.is_active = false;
    patch.termination_date = new Date().toISOString();
  } else {
    patch.is_active = true;
  }
  const row = await updateTeacher(teacherId, tenantId, patch);
  return row as unknown as Teacher;
}
