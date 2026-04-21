import { NextResponse } from "next/server";
import { getCRMTenantId } from "@/app/(app)/crm/_tenant";
import { getServiceClient } from "@/lib/supabase";
/**
 * POST /api/schedule-blocks/cancel-session
 *
 * Body:
 *   block_id       string   — the source block ID (or projected id like "uuid:date")
 *   block_date     string   — YYYY-MM-DD date of the specific occurrence
 *   student_id     string   — student being cancelled (for activity log)
 *   reason         string   — required cancellation reason
 *   scope          "single" | "recurring"
 *                  single   — only this one occurrence → revert to open_time
 *                  recurring — this + all future occurrences of the same recurring block
 *
 * What it does:
 *   - Clears student_id, sets block_type = "open_time", status = "available",
 *     checked_in = false, teacher_tally = false, callout_reason = null
 *   - For "recurring": updates the base recurring block AND creates single-date
 *     exception records for any already-projected future dates that had a student
 *   - Writes an activity_log entry under the student
 */
export async function POST(req) {
    var _a;
    try {
        const tenantId = await getCRMTenantId();
        const db = getServiceClient();
        const body = await req.json();
        const { block_id, block_date, student_id, reason, scope } = body;
        if (!block_id || !block_date || !(reason === null || reason === void 0 ? void 0 : reason.trim()) || !scope) {
            return NextResponse.json({ error: "block_id, block_date, reason, and scope are required" }, { status: 400 });
        }
        // Strip projected suffix to get real DB id (projected ids look like "uuid:YYYY-MM-DD")
        const realBlockId = block_id.includes(":") ? block_id.split(":")[0] : block_id;
        // Fetch the base block
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: baseBlock, error: fetchErr } = await db
            .from("schedule_blocks")
            .select("*")
            .eq("id", realBlockId)
            .eq("tenant_id", tenantId)
            .single();
        if (fetchErr || !baseBlock) {
            return NextResponse.json({ error: "Block not found" }, { status: 404 });
        }
        const openTimeFields = {
            student_id: null,
            block_type: "open_time",
            status: "available",
            checked_in: false,
            teacher_tally: false,
            callout_reason: null,
            updated_at: new Date().toISOString(),
        };
        const today = new Date().toISOString().split("T")[0];
        const updatedBlockIds = [];
        if (scope === "single") {
            if (baseBlock.is_recurring) {
                // For a recurring block, we create a single-date exception override
                // Check if a single-date record already exists for this date
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const { data: existing } = await db
                    .from("schedule_blocks")
                    .select("id")
                    .eq("tenant_id", tenantId)
                    .eq("teacher_id", baseBlock.teacher_id)
                    .eq("location_id", baseBlock.location_id)
                    .eq("block_date", block_date)
                    .eq("start_time", baseBlock.start_time)
                    .eq("end_time", baseBlock.end_time)
                    .eq("is_recurring", false)
                    .maybeSingle();
                if (existing) {
                    // Update the existing single-date record
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    await db
                        .from("schedule_blocks")
                        .update(openTimeFields)
                        .eq("id", existing.id)
                        .eq("tenant_id", tenantId);
                    updatedBlockIds.push(existing.id);
                }
                else {
                    // Create a new single-date open_time exception
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const { data: inserted } = await db
                        .from("schedule_blocks")
                        .insert(Object.assign({ tenant_id: tenantId, teacher_id: baseBlock.teacher_id, location_id: baseBlock.location_id, room_id: (_a = baseBlock.room_id) !== null && _a !== void 0 ? _a : null, block_date, start_time: baseBlock.start_time, end_time: baseBlock.end_time, is_recurring: false }, openTimeFields))
                        .select("id")
                        .single();
                    if (inserted)
                        updatedBlockIds.push(inserted.id);
                }
            }
            else {
                // Non-recurring: just revert the block itself
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                await db
                    .from("schedule_blocks")
                    .update(openTimeFields)
                    .eq("id", realBlockId)
                    .eq("tenant_id", tenantId);
                updatedBlockIds.push(realBlockId);
            }
        }
        else {
            // scope === "recurring": revert base block + all future single-date occurrences
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            await db
                .from("schedule_blocks")
                .update(openTimeFields)
                .eq("id", realBlockId)
                .eq("tenant_id", tenantId);
            updatedBlockIds.push(realBlockId);
            // Also revert any future single-date records for same teacher/time
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { data: futures } = await db
                .from("schedule_blocks")
                .select("id")
                .eq("tenant_id", tenantId)
                .eq("teacher_id", baseBlock.teacher_id)
                .eq("location_id", baseBlock.location_id)
                .eq("start_time", baseBlock.start_time)
                .eq("end_time", baseBlock.end_time)
                .eq("is_recurring", false)
                .eq("student_id", student_id)
                .gte("block_date", today);
            if (futures === null || futures === void 0 ? void 0 : futures.length) {
                const ids = futures.map((r) => r.id);
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                await db
                    .from("schedule_blocks")
                    .update(openTimeFields)
                    .in("id", ids)
                    .eq("tenant_id", tenantId);
                updatedBlockIds.push(...ids);
            }
        }
        // Write activity log
        if (student_id) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            await db.from("activity_log").insert({
                tenant_id: tenantId,
                entity_type: "student",
                entity_id: student_id,
                action: "session_cancelled",
                note: `Session on ${block_date} cancelled (${scope}). Reason: ${reason.trim()}`,
                metadata: {
                    block_id: realBlockId,
                    block_date,
                    reason: reason.trim(),
                    scope,
                    updated_block_ids: updatedBlockIds,
                },
                created_at: new Date().toISOString(),
            });
        }
        return NextResponse.json({ ok: true, updated: updatedBlockIds.length });
    }
    catch (err) {
        console.error("[cancel-session]", err);
        return NextResponse.json({ error: "Failed to cancel session" }, { status: 500 });
    }
}
