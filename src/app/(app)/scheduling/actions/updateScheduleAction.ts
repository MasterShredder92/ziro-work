"use server";

import { updateSchedule } from "@/lib/scheduling/schedulingOps";
import { resolveSchedulingContext } from "../guard";

export async function updateScheduleAction(
  scheduleId: string,
  patch: Partial<{ name: string; color: string | null }>,
) {
  const ctx = await resolveSchedulingContext({ requireWrite: true });
  return updateSchedule(ctx.tenantId, scheduleId, patch);
}
