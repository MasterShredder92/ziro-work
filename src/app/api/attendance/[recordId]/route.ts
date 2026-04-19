import { NextRequest } from "next/server";
import { z } from "zod";
import {
  badRequest,
  noContent,
  notFound,
  ok,
  readJson,
  resolveTenantId,
} from "@/lib/http";
import {
  resolveAttendanceContext,
  respondAttendanceError,
} from "@/lib/attendance/guard";
import {
  deleteAttendanceRecord,
  getAttendanceRecordById,
  upsertAttendanceRecord,
} from "@data/attendanceRecords";
import { overrideRecord } from "@/lib/attendance/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ recordId: string }> };

export async function GET(req: NextRequest, ctx: RouteContext) {
  try {
    const { recordId } = await ctx.params;
    const hinted = resolveTenantId(req);
    const { tenantId } = await resolveAttendanceContext(hinted, "attendance.read");
    const row = await getAttendanceRecordById(recordId, tenantId);
    if (!row) return notFound();
    return ok({ data: row });
  } catch (err) {
    return respondAttendanceError(err);
  }
}

const PatchSchema = z
  .object({
    override: z
      .object({
        status: z.enum([
          "present",
          "absent",
          "tardy",
          "excused",
          "makeup",
          "no_show",
        ]),
        reasonText: z.string().min(1),
        markedBy: z.string().nullable().optional(),
        minutesLate: z.number().int().nullable().optional(),
        arrivedAt: z.string().nullable().optional(),
        leftAt: z.string().nullable().optional(),
        notes: z.string().nullable().optional(),
      })
      .optional(),
  })
  .passthrough();

export async function PATCH(req: NextRequest, ctx: RouteContext) {
  try {
    const { recordId } = await ctx.params;
    const hinted = resolveTenantId(req);
    const { tenantId } = await resolveAttendanceContext(hinted, "attendance.write");

    const body = await readJson(req);
    const parsed = PatchSchema.safeParse(body);
    if (!parsed.success) {
      return badRequest("Invalid patch payload", parsed.error.flatten());
    }

    const existing = await getAttendanceRecordById(recordId, tenantId);
    if (!existing) return notFound();

    if (parsed.data.override) {
      const override = await overrideRecord({
        tenantId,
        recordId,
        status: parsed.data.override.status,
        reasonText: parsed.data.override.reasonText,
        markedBy: parsed.data.override.markedBy ?? null,
        minutesLate: parsed.data.override.minutesLate ?? null,
        arrivedAt: parsed.data.override.arrivedAt ?? null,
        leftAt: parsed.data.override.leftAt ?? null,
        notes: parsed.data.override.notes ?? null,
      });
      return ok({ data: override, overrideOf: existing.id });
    }

    const { override: _skip, ...patchFields } = parsed.data as Record<
      string,
      unknown
    > & { override?: unknown };
    void _skip;
    const merged = {
      ...existing,
      ...patchFields,
      id: existing.id,
      tenant_id: existing.tenant_id,
    };

    const row = await upsertAttendanceRecord(merged);
    return ok({ data: row });
  } catch (err) {
    return respondAttendanceError(err);
  }
}

export async function DELETE(req: NextRequest, ctx: RouteContext) {
  try {
    const { recordId } = await ctx.params;
    const hinted = resolveTenantId(req);
    const { tenantId } = await resolveAttendanceContext(hinted, "attendance.write");

    const existing = await getAttendanceRecordById(recordId, tenantId);
    if (!existing) return notFound();
    await deleteAttendanceRecord(recordId, tenantId);
    return noContent();
  } catch (err) {
    return respondAttendanceError(err);
  }
}
