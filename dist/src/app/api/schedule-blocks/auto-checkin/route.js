/**
 * POST /api/schedule-blocks/auto-checkin
 *
 * Auto check-in engine. Called by the schedule page on an interval (every 60s).
 * For every block whose start_time has passed today:
 *   - If the student's family has a PAID Square invoice this month → checked_in=true, teacher_tally=true
 *   - Otherwise → checked_in=true, teacher_tally=false (half check-in, pending payment)
 *
 * Skips blocks that are already checked_in, or are call_outs, or have no student.
 *
 * Returns { updated: number, blocks: [{id, student_id, teacher_tally}] }
 */
import { NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";
import { getCRMTenantId } from "@/app/(app)/crm/_tenant";
export const dynamic = "force-dynamic";
export async function POST(_req) {
    try {
        const tenantId = await getCRMTenantId();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const db = getServiceClient();
        const now = new Date();
        const todayStr = now.toISOString().split("T")[0];
        // Current time as HH:MM:SS
        const nowTime = now.toTimeString().slice(0, 8);
        // ── 1. Fetch all booked blocks for today that haven't been checked in yet
        //       and whose start_time has passed
        const { data: blocks, error: blocksError } = await db
            .from("schedule_blocks")
            .select("id, student_id, teacher_id, location_id, block_date, start_time, end_time, block_type, is_family_callout, teacher_tally, checked_in, status")
            .eq("tenant_id", tenantId)
            .eq("block_date", todayStr)
            .eq("checked_in", false)
            .eq("status", "booked")
            .lte("start_time", nowTime)
            .not("block_type", "in", '("call_out","open_time")')
            .not("student_id", "is", null)
            .limit(500);
        if (blocksError)
            throw blocksError;
        if (!blocks || blocks.length === 0) {
            return NextResponse.json({ updated: 0, blocks: [] });
        }
        // ── 2. Get unique family IDs for all students in these blocks
        const studentIds = [...new Set(blocks.map((b) => b.student_id).filter(Boolean))];
        const { data: students } = await db
            .from("students")
            .select("id, family_id")
            .in("id", studentIds)
            .eq("tenant_id", tenantId);
        const studentFamilyMap = new Map();
        for (const s of (students !== null && students !== void 0 ? students : [])) {
            if (s.family_id)
                studentFamilyMap.set(s.id, s.family_id);
        }
        const familyIds = [...new Set([...studentFamilyMap.values()])];
        // ── 3. Check which families have a PAID Square invoice this month
        const mtdStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
        const mtdEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split("T")[0];
        // Families with paid invoices this month — use family_id on square_invoices_fact if available,
        // otherwise fall back to checking if any student in the family has a paid invoice
        const { data: paidInvoices } = await db
            .from("square_invoices_fact")
            .select("family_id, status")
            .eq("tenant_id", tenantId)
            .eq("status", "PAID")
            .gte("due_date", mtdStart)
            .lte("due_date", mtdEnd)
            .in("family_id", familyIds.length > 0 ? familyIds : ["__none__"])
            .limit(10000);
        const paidFamilyIds = new Set((paidInvoices !== null && paidInvoices !== void 0 ? paidInvoices : []).map((inv) => inv.family_id).filter(Boolean));
        // ── 4. Build update batches
        const toUpdate = [];
        for (const block of blocks) {
            if (!block.student_id)
                continue;
            // Skip call-outs and family callouts
            if (block.block_type === "call_out" || block.is_family_callout)
                continue;
            const familyId = studentFamilyMap.get(block.student_id);
            const familyPaid = familyId ? paidFamilyIds.has(familyId) : false;
            toUpdate.push({
                id: block.id,
                teacher_tally: familyPaid,
                student_id: block.student_id,
            });
        }
        if (toUpdate.length === 0) {
            return NextResponse.json({ updated: 0, blocks: [] });
        }
        // ── 5. Batch update — Supabase doesn't support bulk update with different values per row,
        //       so we split into two groups: paid (tally=true) and unpaid (tally=false)
        const paidBlocks = toUpdate.filter((b) => b.teacher_tally);
        const unpaidBlocks = toUpdate.filter((b) => !b.teacher_tally);
        const checkedInAt = now.toISOString();
        if (paidBlocks.length > 0) {
            await db
                .from("schedule_blocks")
                .update({
                checked_in: true,
                checked_in_at: checkedInAt,
                teacher_tally: true,
                updated_at: checkedInAt,
            })
                .in("id", paidBlocks.map((b) => b.id))
                .eq("tenant_id", tenantId);
        }
        if (unpaidBlocks.length > 0) {
            await db
                .from("schedule_blocks")
                .update({
                checked_in: true,
                checked_in_at: checkedInAt,
                teacher_tally: false,
                updated_at: checkedInAt,
            })
                .in("id", unpaidBlocks.map((b) => b.id))
                .eq("tenant_id", tenantId);
        }
        return NextResponse.json({
            updated: toUpdate.length,
            blocks: toUpdate,
            paid: paidBlocks.length,
            pending_payment: unpaidBlocks.length,
        });
    }
    catch (err) {
        console.error("[auto-checkin]", err);
        return NextResponse.json({ error: "Auto check-in failed" }, { status: 500 });
    }
}
