import "server-only";

import { getServiceClient } from "@/lib/supabase";
import { assertServiceRoleAllowed } from "@/lib/supabaseAuthenticated";

/**
 * Best-effort student timeline entry for schedule mutations.
 * Never throws — failures are logged so booking/update still succeeds.
 */
export async function logStudentScheduleActivity(opts: {
  tenantId: string;
  studentId: string;
  action: string;
  details: Record<string, unknown>;
  locationId?: string | null;
}): Promise<void> {
  try {
    assertServiceRoleAllowed("src/lib/schedule/studentActivityLog.ts — service-role module; internal/background operations only");
    const supabase = getServiceClient();
    const { error } = await supabase.from("activity_log").insert({
      tenant_id: opts.tenantId,
      entity_type: "student",
      entity_id: opts.studentId,
      entity_name: null,
      action: opts.action,
      details: JSON.stringify(opts.details),
      location_id: opts.locationId ?? null,
    });
    if (error) {
      console.error("[studentActivityLog]", error.message);
    }
  } catch (e) {
    console.error("[studentActivityLog]", e);
  }
}
