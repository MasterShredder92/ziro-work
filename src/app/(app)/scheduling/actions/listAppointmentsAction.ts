"use server";

import { listAppointments } from "@/lib/scheduling/schedulingOps";
import type { DateRange } from "@/lib/scheduling/types";
import { resolveSchedulingContext } from "../guard";

export async function listAppointmentsAction(
  scheduleId: string,
  range: DateRange,
) {
  const ctx = await resolveSchedulingContext();
  return listAppointments(ctx.tenantId, scheduleId, range);
}
