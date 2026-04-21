"use server";
import { createAvailabilityBlock } from "@/lib/scheduling/schedulingOps";
import { resolveSchedulingContext } from "../guard";
export async function createAvailabilityBlockAction(scheduleId, input) {
    const ctx = await resolveSchedulingContext({ requireWrite: true });
    return createAvailabilityBlock(ctx.tenantId, scheduleId, input);
}
