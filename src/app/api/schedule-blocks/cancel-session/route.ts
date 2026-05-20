import { NextRequest, NextResponse } from "next/server";
import { createTenantBoundSupabaseClient } from "@/lib/supabaseAuthenticated";
import { requirePermission } from "@/lib/auth/guards";
import { assertLocationAllowed, resolveUserLocationAccess } from "@/lib/auth/locationAccess";
import { logStudentScheduleActivity } from "@/lib/schedule/studentActivityLog";

/**
 * POST /api/schedule-blocks/cancel-session
 *
 * Body:
 *   block_id       string   — the source block ID (or projected id like "uuid:date")
 *   block_date     string   — YYYY-MM-DD date of the specific occurrence
 *   student_id     string   — student being cancelled (for activity log)
 *   reason         string   — required cancellation reason
 *   scope          "single" | "recurring"
 */
export async function POST(req: NextRequest) {
  try {
    const session = await requirePermission("schedule.write")();
    const tenantId = session.tenantId;
    const db = await createTenantBoundSupabaseClient({ tenantId });
    const body = await req.json();

    const { block_id, block_date, student_id, reason, scope } = body as {
      block_id: string;
      block_date: string;
      student_id: string;
      reason: string;
      scope: "single" | "recurring";
    };

    if (!block_id || !block_date || !reason?.trim() || !scope) {
      return NextResponse.json({ error: "block_id, block_date, reason, and scope are required" }, { status: 400 });
    }

    const realBlockId = block_id.includes(":") ? block_id.split(":")[0] : block_id;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: baseBlock, error: fetchErr } = await (db as any)
      .from("schedule_blocks")
      .select("*")
      .eq("id", realBlockId)
      .eq("tenant_id", tenantId)
      .single();

    if (fetchErr || !baseBlock) {
      return NextResponse.json({ error: "Block not found" }, { status: 404 });
    }

    const access = await resolveUserLocationAccess({
      session,
      preferredLocationId: baseBlock.location_id,
      autoRepairProfileLocation: true,
    });
    const allowed = assertLocationAllowed(access, baseBlock.location_id);
    if (!allowed || allowed !== baseBlock.location_id) {
      return NextResponse.json({ error: "Location access denied" }, { status: 403 });
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
    const updatedBlockIds: string[] = [];

    if (scope === "single") {
      if (baseBlock.is_recurring) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: existing } = await (db as any)
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
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await (db as any)
            .from("schedule_blocks")
            .update(openTimeFields)
            .eq("id", existing.id)
            .eq("tenant_id", tenantId);
          updatedBlockIds.push(existing.id);
        } else {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { data: inserted } = await (db as any)
            .from("schedule_blocks")
            .insert({
              tenant_id: tenantId,
              teacher_id: baseBlock.teacher_id,
              location_id: baseBlock.location_id,
              room_id: baseBlock.room_id ?? null,
              block_date,
              start_time: baseBlock.start_time,
              end_time: baseBlock.end_time,
              is_recurring: false,
              ...openTimeFields,
            })
            .select("id")
            .single();
          if (inserted) updatedBlockIds.push(inserted.id);
        }
      } else {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (db as any)
          .from("schedule_blocks")
          .update(openTimeFields)
          .eq("id", realBlockId)
          .eq("tenant_id", tenantId);
        updatedBlockIds.push(realBlockId);
      }
    } else {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (db as any)
        .from("schedule_blocks")
        .update(openTimeFields)
        .eq("id", realBlockId)
        .eq("tenant_id", tenantId);
      updatedBlockIds.push(realBlockId);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: futures } = await (db as any)
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

      if (futures?.length) {
        const ids = futures.map((r: { id: string }) => r.id);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (db as any)
          .from("schedule_blocks")
          .update(openTimeFields)
          .in("id", ids)
          .eq("tenant_id", tenantId);
        updatedBlockIds.push(...ids);
      }
    }

    if (student_id) {
      await logStudentScheduleActivity({
        tenantId,
        studentId: student_id,
        action: "session_cancelled",
        locationId: baseBlock.location_id ?? null,
        details: {
          block_id: realBlockId,
          block_date,
          reason: reason.trim(),
          scope,
          updated_block_ids: updatedBlockIds,
          teacher_id: baseBlock.teacher_id,
        },
      });
    }

    return NextResponse.json({ ok: true, updated: updatedBlockIds.length });
  } catch (err) {
    console.error("[cancel-session]", err);
    const msg = err instanceof Error ? err.message : "";
    if (msg === "UNAUTHENTICATED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (msg === "FORBIDDEN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    return NextResponse.json({ error: "Failed to cancel session" }, { status: 500 });
  }
}
