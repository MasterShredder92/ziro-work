"use server";

import { createAppointment } from "@/lib/scheduling/schedulingOps";
import type { AppointmentStatus, RecurrenceRule } from "@/lib/scheduling/types";
import { resolveSchedulingContext } from "../guard";

type CreateAppointmentInput = {
  title: string;
  startsAt: string;
  endsAt: string;
  notes?: string | null;
  status?: AppointmentStatus;
  recurrence?: RecurrenceRule | null;
  color?: string | null;
};

export async function createAppointmentAction(
  scheduleId: string,
  data: CreateAppointmentInput,
) {
  const ctx = await resolveSchedulingContext({ requireWrite: true });
  return createAppointment(ctx.tenantId, scheduleId, data);
}
