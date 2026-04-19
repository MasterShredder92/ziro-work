"use server";

import { createSchedule } from "@/lib/scheduling/schedulingOps";
import { resolveSchedulingContext } from "../guard";

export async function createScheduleAction(input: { name: string; color?: string | null }) {
  const ctx = await resolveSchedulingContext({ requireWrite: true });
  return createSchedule(ctx.tenantId, input);
}
