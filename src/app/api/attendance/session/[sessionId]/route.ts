import { NextRequest } from "next/server";
import { z } from "zod";
import {
  badRequest,
  created,
  notFound,
  ok,
  readJson,
  resolveTenantId,
} from "@/lib/http";
import {
  resolveAttendanceContext,
  respondAttendanceError,
} from "@/lib/attendance/guard";
import { getSessionWithRoster } from "@/lib/attendance/service";
import {
  markAbsent,
  markExcused,
  markMakeup,
  markNoShow,
  markPresent,
  markTardy,
  type MarkInput,
} from "@/lib/attendance/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ sessionId: string }> };

export async function GET(req: NextRequest, ctx: RouteContext) {
  try {
    const { sessionId } = await ctx.params;
    const hinted = resolveTenantId(req);
    const { tenantId } = await resolveAttendanceContext(hinted, "attendance.read");
    const data = await getSessionWithRoster(sessionId, tenantId);
    if (!data) return notFound();
    return ok({ data });
  } catch (err) {
    return respondAttendanceError(err);
  }
}

const MarkSingleSchema = z.object({
  studentId: z.string().min(1),
  status: z.enum([
    "present",
    "absent",
    "tardy",
    "excused",
    "makeup",
    "no_show",
  ]),
  markedBy: z.string().nullable().optional(),
  arrivedAt: z.string().nullable().optional(),
  leftAt: z.string().nullable().optional(),
  minutesLate: z.number().int().nullable().optional(),
  reasonId: z.string().nullable().optional(),
  reasonText: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  scheduleBlockId: z.string().nullable().optional(),
  teacherId: z.string().nullable().optional(),
});

const BulkSchema = z.object({
  entries: z.array(MarkSingleSchema).min(1).max(500),
});

const BodySchema = z.union([MarkSingleSchema, BulkSchema]);

function dispatchMark(input: MarkInput, status: string) {
  switch (status) {
    case "present":
      return markPresent(input);
    case "absent":
      return markAbsent(input);
    case "tardy":
      return markTardy(input);
    case "excused":
      return markExcused(input);
    case "makeup":
      return markMakeup(input);
    case "no_show":
      return markNoShow(input);
    default:
      throw new Error("INVALID_STATUS");
  }
}

export async function POST(req: NextRequest, ctx: RouteContext) {
  try {
    const { sessionId } = await ctx.params;
    const hinted = resolveTenantId(req);
    const { tenantId } = await resolveAttendanceContext(hinted, "attendance.write");
    const body = await readJson(req);
    const parsed = BodySchema.safeParse(body);
    if (!parsed.success) {
      return badRequest("Invalid mark payload", parsed.error.flatten());
    }

    if ("entries" in parsed.data) {
      const results = [];
      for (const entry of parsed.data.entries) {
        const out = await dispatchMark(
          {
            tenantId,
            sessionId,
            studentId: entry.studentId,
            markedBy: entry.markedBy ?? null,
            arrivedAt: entry.arrivedAt ?? null,
            leftAt: entry.leftAt ?? null,
            minutesLate: entry.minutesLate ?? null,
            reasonId: entry.reasonId ?? null,
            reasonText: entry.reasonText ?? null,
            notes: entry.notes ?? null,
            scheduleBlockId: entry.scheduleBlockId ?? null,
            teacherId: entry.teacherId ?? null,
          },
          entry.status,
        );
        results.push(out);
      }
      return created({ data: results, count: results.length });
    }

    const row = await dispatchMark(
      {
        tenantId,
        sessionId,
        studentId: parsed.data.studentId,
        markedBy: parsed.data.markedBy ?? null,
        arrivedAt: parsed.data.arrivedAt ?? null,
        leftAt: parsed.data.leftAt ?? null,
        minutesLate: parsed.data.minutesLate ?? null,
        reasonId: parsed.data.reasonId ?? null,
        reasonText: parsed.data.reasonText ?? null,
        notes: parsed.data.notes ?? null,
        scheduleBlockId: parsed.data.scheduleBlockId ?? null,
        teacherId: parsed.data.teacherId ?? null,
      },
      parsed.data.status,
    );
    return created({ data: row });
  } catch (err) {
    return respondAttendanceError(err);
  }
}
