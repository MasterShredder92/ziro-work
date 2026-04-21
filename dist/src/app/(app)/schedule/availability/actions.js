"use server";
import { revalidatePath } from "next/cache";
import { resolveScheduleContext } from "../guard";
import { setTeacherAvailability } from "@/lib/schedule/availability";
import { logAudit } from "@/lib/audit/log";
export async function saveTeacherAvailabilityAction(teacherId, form) {
    var _a, _b;
    const ctx = await resolveScheduleContext({ requireWrite: true });
    const slots = [];
    for (let day = 0; day < 7; day++) {
        const enabled = form.get(`day_${day}_enabled`) === "on";
        if (!enabled)
            continue;
        const startTime = String((_a = form.get(`day_${day}_start`)) !== null && _a !== void 0 ? _a : "09:00");
        const endTime = String((_b = form.get(`day_${day}_end`)) !== null && _b !== void 0 ? _b : "17:00");
        if (!startTime || !endTime)
            continue;
        slots.push({
            dayOfWeek: day,
            startTime,
            endTime,
            effectiveFrom: null,
            effectiveUntil: null,
            notes: null,
        });
    }
    const written = await setTeacherAvailability(ctx.tenantId, teacherId, slots);
    await logAudit("schedule.availability.save", {
        tenantId: ctx.tenantId,
        profileId: ctx.session.userId,
        teacherId,
        slotCount: written.length,
    });
    revalidatePath(`/schedule/availability?teacherId=${teacherId}`);
    revalidatePath("/schedule/availability");
}
