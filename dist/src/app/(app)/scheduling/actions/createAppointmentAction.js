"use server";
import { createAppointment } from "@/lib/scheduling/schedulingOps";
import { resolveSchedulingContext } from "../guard";
export async function createAppointmentAction(scheduleId, data) {
    const ctx = await resolveSchedulingContext({ requireWrite: true });
    return createAppointment(ctx.tenantId, scheduleId, data);
}
