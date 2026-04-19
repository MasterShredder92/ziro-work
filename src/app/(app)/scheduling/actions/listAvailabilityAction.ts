"use server";

import { listAvailability } from "@/lib/scheduling/schedulingOps";
import type { DateRange } from "@/lib/scheduling/types";
import { resolveSchedulingContext } from "../guard";

export async function listAvailabilityAction(
  scheduleId: string,
  range: DateRange,
) {
  const ctx = await resolveSchedulingContext();
  return listAvailability(ctx.tenantId, scheduleId, range);
}
