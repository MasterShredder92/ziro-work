"use server";
import { requirePermission } from "@/lib/auth/guards";
import { getSchedule } from "@/lib/scheduling/schedulingOps";
export async function getScheduleAction(scheduleId) {
    const session = await requirePermission("scheduling.read")();
    return getSchedule(session.tenantId, scheduleId);
}
