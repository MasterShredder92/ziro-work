import "server-only";

import { getServiceClient } from "@/lib/supabase";
import { assertServiceRoleAllowed } from "@/lib/supabaseAuthenticated";

type TeacherAssignmentInput = {
  teacherId: string;
  locationId: string;
};

type TeacherAssignmentValidation =
  | { ok: true }
  | { ok: false; error: string };

export async function validateTeacherLocationAssignment(
  input: TeacherAssignmentInput,
): Promise<TeacherAssignmentValidation> {
  assertServiceRoleAllowed("src/lib/schedule/teacherAssignmentIntegrity.ts — service-role module; internal/background operations only");
  const supabase = getServiceClient();

  const { data: anyAssignments, error: anyAssignmentsError } = await supabase
    .from("teacher_locations")
    .select("id")
    .eq("teacher_id", input.teacherId)
    .limit(1);

  if (anyAssignmentsError) {
    return { ok: false, error: "Unable to validate teacher assignment." };
  }

  if (!anyAssignments || anyAssignments.length === 0) {
    // Backward-compatible fallback for tenants that have not populated teacher_locations.
    return { ok: true };
  }

  const { data: locationAssignment, error: locationAssignmentError } = await supabase
    .from("teacher_locations")
    .select("id")
    .eq("teacher_id", input.teacherId)
    .eq("location_id", input.locationId)
    .limit(1);

  if (locationAssignmentError) {
    return { ok: false, error: "Unable to validate teacher assignment." };
  }

  if (!locationAssignment || locationAssignment.length === 0) {
    return {
      ok: false,
      error: "Teacher is not assigned to the selected location.",
    };
  }

  return { ok: true };
}
