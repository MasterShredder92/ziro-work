"use server";
import { listAvailability } from "@/lib/scheduling/schedulingOps";
import { resolveSchedulingContext } from "../guard";
export async function listAvailabilityAction(scheduleId, range) {
    const ctx = await resolveSchedulingContext();
    return listAvailability(ctx.tenantId, scheduleId, range);
}
