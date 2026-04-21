"use server";
import { listAppointments } from "@/lib/scheduling/schedulingOps";
import { resolveSchedulingContext } from "../guard";
export async function listAppointmentsAction(scheduleId, range) {
    const ctx = await resolveSchedulingContext();
    return listAppointments(ctx.tenantId, scheduleId, range);
}
