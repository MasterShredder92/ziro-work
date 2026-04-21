"use server";
import { updateAppointment } from "@/lib/scheduling/schedulingOps";
import { resolveSchedulingContext } from "../guard";
export async function updateAppointmentAction(appointmentId, patch) {
    const ctx = await resolveSchedulingContext({ requireWrite: true });
    return updateAppointment(ctx.tenantId, appointmentId, patch);
}
