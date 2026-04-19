import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createEventWithSideEffects } from "@/lib/schedule/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CreateSchema = z.object({
  tenantId: z.string().min(1),
  title: z.string().min(1),
  startTime: z.string().min(1),
  endTime: z.string().min(1),
  teacherId: z.string().nullable().optional(),
  studentId: z.string().nullable().optional(),
  familyId: z.string().nullable().optional(),
  roomId: z.string().nullable().optional(),
  locationId: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  kind: z
    .enum(["lesson", "group", "makeup", "evaluation", "hold", "event", "other"])
    .optional(),
  status: z
    .enum([
      "scheduled",
      "confirmed",
      "cancelled",
      "completed",
      "no_show",
      "rescheduled",
    ])
    .optional(),
  createdBy: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = CreateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid scheduling payload", details: parsed.error.flatten() },
        { status: 400 },
      );
    }
    const input = parsed.data;
    const event = await createEventWithSideEffects(input.tenantId, {
      title: input.title,
      startTime: input.startTime,
      endTime: input.endTime,
      teacherId: input.teacherId ?? null,
      studentId: input.studentId ?? null,
      familyId: input.familyId ?? null,
      roomId: input.roomId ?? null,
      locationId: input.locationId ?? null,
      notes: input.notes ?? null,
      kind: input.kind ?? "lesson",
      status: input.status ?? "scheduled",
      createdBy: input.createdBy ?? "automation",
    });
    return NextResponse.json(
      {
        data: event,
        meta: {
          surface: "schedule-events",
          note: "This endpoint creates schedule events with side-effects.",
        },
      },
      {
        status: 201,
        headers: { "X-Ziro-Scheduling-Surface": "schedule-events" },
      },
    );
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Server error" },
      { status: 500 },
    );
  }
}
