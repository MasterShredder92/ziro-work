"use server";
import { listSchedules } from "@/lib/scheduling/schedulingOps";
import { resolveSchedulingContext } from "../guard";
export async function listSchedulesAction() {
    const ctx = await resolveSchedulingContext();
    return listSchedules(ctx.tenantId);
}
