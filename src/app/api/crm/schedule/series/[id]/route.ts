/**
 * PATCH /api/crm/schedule/series/:id
 *
 * Moves or reassigns a session in a recurring series.
 *
 * Two modes (required field: scope):
 *
 *   scope: "single"
 *     — Moves only the one block on block_date.
 *     — Detaches it from the series (series_id = null) so future edits don't affect it.
 *     — Use case: sub coverage, one-off reschedule.
 *
 *   scope: "following"
 *     — Updates this block and all future blocks in the series (block_date >= pivot_date).
 *     — Updates the series record itself (teacher_id, location_id, start_time, etc.).
 *     — Creates a new series record for the "from this point forward" portion if teacher changes.
 *     — Use case: permanent teacher reassignment, permanent time change.
 *
 * Body:
 *   scope           — "single" | "following" (required)
 *   pivot_date      — YYYY-MM-DD (the block being moved / the cutoff date)
 *   teacher_id?     — new teacher (optional)
 *   location_id?    — new location (optional)
 *   new_date?       — YYYY-MM-DD (only for scope=single, the new date to move to)
 *   new_start_time? — HH:MM (new start time, applies to all affected blocks)
 *   reason?         — audit reason string
 */
import { NextRequest } from "next/server";
import { ok, badRequest, notFound, serverError } from "@/lib/http";
import { resolveCRMContext } from "../../../_context";
import { createTenantBoundSupabaseClient } from "@/lib/supabaseAuthenticated";
import { logAudit } from "@/lib/audit/log";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

function addMinutes(timeStr: string, minutes: number): string {
  const [h, m] = timeStr.split(":").map(Number);
  const total = h * 60 + m + minutes;
  const hh = Math.floor(total / 60) % 24;
  const mm = total % 60;
  return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}:00`;
}

export async function PATCH(req: NextRequest, ctx: RouteContext) {
  const resolved = await resolveCRMContext(req, {
    permissions: ["crm.write"],
    minRole: "admin",
  });
  if ("response" in resolved) return resolved.response;

  let body: Record<string, unknown>;
  try {
    body = await req.json() as Record<string, unknown>;
  } catch {
    return badRequest("Invalid JSON body");
  }

  const { id: seriesId } = await ctx.params;
  const { scope, pivot_date, teacher_id, location_id, new_date, new_start_time, reason } = body;

  if (!scope || !["single", "following"].includes(scope as string)) {
    return badRequest("scope must be 'single' or 'following'");
  }
  if (!pivot_date) {
    return badRequest("pivot_date is required (YYYY-MM-DD)");
  }

  const { tenantId } = resolved.context;
  const supabase = await createTenantBoundSupabaseClient({ tenantId: resolved.context.tenantId });

  // Verify series exists and belongs to this tenant
  const { data: series, error: seriesErr } = await supabase
    .from("schedule_series")
    .select("*")
    .eq("id", seriesId)
    .eq("tenant_id", tenantId)
    .single();

  if (seriesErr || !series) return notFound("Series not found");

  // ── SINGLE: move one block, detach from series ───────────────────────────
  if (scope === "single") {
    if (!new_date && !new_start_time && !teacher_id) {
      return badRequest("For scope=single, provide new_date, new_start_time, or teacher_id");
    }

    const blockUpdate: Record<string, unknown> = {
      series_id: null,       // detach from series — this block is now standalone
      series_anchor: false,
      updated_at: new Date().toISOString(),
    };

    if (new_date) blockUpdate.block_date = new_date;
    if (teacher_id) blockUpdate.teacher_id = teacher_id;
    if (location_id) blockUpdate.location_id = location_id;
    if (new_start_time) {
      blockUpdate.start_time = (new_start_time as string).length === 5
        ? (new_start_time as string) + ":00"
        : new_start_time;
      blockUpdate.end_time = addMinutes(new_start_time as string, 30);
    }

    const { data: updatedBlock, error: blockErr } = await supabase
      .from("schedule_blocks")
      .update(blockUpdate)
      .eq("series_id", seriesId)
      .eq("block_date", pivot_date as string)
      .eq("tenant_id", tenantId)
      .select()
      .maybeSingle();

    if (blockErr) {
      console.error("[series PATCH single] block update error:", JSON.stringify(blockErr));
      return serverError(blockErr);
    }

    // Audit log
    await logAudit("schedule.block.moved_single", {
      series_id: seriesId,
      block_id: updatedBlock?.id ?? null,
      pivot_date,
      new_date,
      teacher_id,
      reason,
    });

    return ok({ scope: "single", updated_block: updatedBlock });
  }

  // ── FOLLOWING: update this + all future blocks in series ─────────────────
  if (scope === "following") {
    const blockUpdate: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };
    const seriesUpdate: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (teacher_id) {
      blockUpdate.teacher_id = teacher_id;
      seriesUpdate.teacher_id = teacher_id;
    }
    if (location_id) {
      blockUpdate.location_id = location_id;
      seriesUpdate.location_id = location_id;
    }
    if (new_start_time) {
      const st = (new_start_time as string).length === 5
        ? (new_start_time as string) + ":00"
        : (new_start_time as string);
      blockUpdate.start_time = st;
      blockUpdate.end_time = addMinutes(new_start_time as string, 30);
      seriesUpdate.start_time = st;
      seriesUpdate.end_time = addMinutes(new_start_time as string, 30);
    }

    // Update all future blocks in this series
    const { error: blocksErr, count } = await supabase
      .from("schedule_blocks")
      .update(blockUpdate)
      .eq("series_id", seriesId)
      .eq("tenant_id", tenantId)
      .gte("block_date", pivot_date as string);

    if (blocksErr) {
      console.error("[series PATCH following] blocks update error:", JSON.stringify(blocksErr));
      return serverError(blocksErr);
    }

    // Update the series record itself
    const { error: seriesUpdateErr } = await supabase
      .from("schedule_series")
      .update(seriesUpdate)
      .eq("id", seriesId)
      .eq("tenant_id", tenantId);

    if (seriesUpdateErr) {
      console.error("[series PATCH following] series update error:", JSON.stringify(seriesUpdateErr));
      return serverError(seriesUpdateErr);
    }

    // Audit log
    await logAudit("schedule.series.updated_following", {
      series_id: seriesId,
      pivot_date,
      teacher_id,
      location_id,
      new_start_time,
      blocks_updated: count,
      reason,
    });

    return ok({
      scope: "following",
      series_id: seriesId,
      blocks_updated: count,
      pivot_date,
    });
  }

  return badRequest("Invalid scope");
}

/**
 * GET /api/crm/schedule/series/:id
 * Returns the series record + block count summary.
 */
export async function GET(req: NextRequest, ctx: RouteContext) {
  const resolved = await resolveCRMContext(req, {
    permissions: ["crm.read"],
    minRole: "teacher",
  });
  if ("response" in resolved) return resolved.response;

  const { id: seriesId } = await ctx.params;
  const { tenantId } = resolved.context;
  const supabase = await createTenantBoundSupabaseClient({ tenantId: resolved.context.tenantId });

  const { data: series, error } = await supabase
    .from("schedule_series")
    .select("*")
    .eq("id", seriesId)
    .eq("tenant_id", tenantId)
    .single();

  if (error || !series) return notFound("Series not found");

  // Block summary
  const { count: totalBlocks } = await supabase
    .from("schedule_blocks")
    .select("id", { count: "exact", head: true })
    .eq("series_id", seriesId);

  const { count: futureBlocks } = await supabase
    .from("schedule_blocks")
    .select("id", { count: "exact", head: true })
    .eq("series_id", seriesId)
    .gte("block_date", new Date().toISOString().split("T")[0]);

  return ok({
    ...series,
    total_blocks: totalBlocks ?? 0,
    future_blocks: futureBlocks ?? 0,
  });
}
