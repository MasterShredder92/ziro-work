"use server";
import { updateAvailabilityBlock } from "@/lib/scheduling/schedulingOps";
import { resolveSchedulingContext } from "../guard";
export async function updateAvailabilityBlockAction(blockId, patch) {
    const ctx = await resolveSchedulingContext({ requireWrite: true });
    return updateAvailabilityBlock(ctx.tenantId, blockId, patch);
}
