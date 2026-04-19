"use server";

import { createAvailabilityBlock } from "@/lib/scheduling/schedulingOps";
import { resolveSchedulingContext } from "../guard";

export async function createAvailabilityBlockAction(
  scheduleId: string,
  input: { dayOfWeek: number; startTime: string; endTime: string },
) {
  const ctx = await resolveSchedulingContext({ requireWrite: true });
  return createAvailabilityBlock(ctx.tenantId, scheduleId, input);
}
