"use server";
import { updateSchedule } from "@/lib/scheduling/schedulingOps";
import { resolveSchedulingContext } from "../guard";
export async function updateScheduleAction(scheduleId, patch) {
    const ctx = await resolveSchedulingContext({ requireWrite: true });
    return updateSchedule(ctx.tenantId, scheduleId, patch);
}
