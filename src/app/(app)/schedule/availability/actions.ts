"use server";

import { revalidatePath } from "next/cache";
import { resolveScheduleContext } from "../guard";
import { setTeacherAvailability } from "@/lib/schedule/availability";
import type { TeacherAvailabilityInsert } from "@/lib/schedule/types";
import { logAudit } from "@/lib/audit/log";

type SlotInput = Omit<TeacherAvailabilityInsert, "tenantId" | "teacherId">;

export async function saveTeacherAvailabilityAction(
  teacherId: string,
  form: FormData,
): Promise<void> {
  const ctx = await resolveScheduleContext({ requireWrite: true });
  const slots: SlotInput[] = [];
  for (let day = 0; day < 7; day++) {
    const enabled = form.get(`day_${day}_enabled`) === "on";
    if (!enabled) continue;
    const startTime = String(form.get(`day_${day}_start`) ?? "09:00");
    const endTime = String(form.get(`day_${day}_end`) ?? "17:00");
    if (!startTime || !endTime) continue;
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
