"use server";
import { deleteAvailabilityBlock } from "@/lib/scheduling/schedulingOps";
import { resolveSchedulingContext } from "../guard";
export async function deleteAvailabilityBlockAction(blockId) {
    const ctx = await resolveSchedulingContext({ requireWrite: true });
    await deleteAvailabilityBlock(ctx.tenantId, blockId);
    return { ok: true };
}
