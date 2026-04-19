"use server";

import { updateAppointment } from "@/lib/scheduling/schedulingOps";
import type { AppointmentStatus, RecurrenceRule } from "@/lib/scheduling/types";
import { resolveSchedulingContext } from "../guard";

type UpdateAppointmentPatch = Partial<{
  title: string;
  startsAt: string;
  endsAt: string;
  notes: string | null;
  status: AppointmentStatus;
  recurrence: RecurrenceRule | null;
  color: string | null;
}>;

export async function updateAppointmentAction(
  appointmentId: string,
  patch: UpdateAppointmentPatch,
) {
  const ctx = await resolveSchedulingContext({ requireWrite: true });
  return updateAppointment(ctx.tenantId, appointmentId, patch);
}
