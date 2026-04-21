import { NextResponse } from "next/server";
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
export async function POST(req) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j;
    try {
        const body = await req.json();
        const parsed = CreateSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json({ error: "Invalid scheduling payload", details: parsed.error.flatten() }, { status: 400 });
        }
        const input = parsed.data;
        const event = await createEventWithSideEffects(input.tenantId, {
            title: input.title,
            startTime: input.startTime,
            endTime: input.endTime,
            teacherId: (_a = input.teacherId) !== null && _a !== void 0 ? _a : null,
            studentId: (_b = input.studentId) !== null && _b !== void 0 ? _b : null,
            familyId: (_c = input.familyId) !== null && _c !== void 0 ? _c : null,
            roomId: (_d = input.roomId) !== null && _d !== void 0 ? _d : null,
            locationId: (_e = input.locationId) !== null && _e !== void 0 ? _e : null,
            notes: (_f = input.notes) !== null && _f !== void 0 ? _f : null,
            kind: (_g = input.kind) !== null && _g !== void 0 ? _g : "lesson",
            status: (_h = input.status) !== null && _h !== void 0 ? _h : "scheduled",
            createdBy: (_j = input.createdBy) !== null && _j !== void 0 ? _j : "automation",
        });
        return NextResponse.json({
            data: event,
            meta: {
                surface: "schedule-events",
                note: "This endpoint creates schedule events with side-effects.",
            },
        }, {
            status: 201,
            headers: { "X-Ziro-Scheduling-Surface": "schedule-events" },
        });
    }
    catch (error) {
        return NextResponse.json({ error: error instanceof Error ? error.message : "Server error" }, { status: 500 });
    }
}
