import type { AgentContext } from "../agents/types";
import type { Attendance } from "../types/attendance";
import { getTenantSettings } from "./getTenantSettings";

export type AttendanceHealth = "healthy" | "warning" | "at_risk";

export async function computeAttendanceHealth(
  ctx: AgentContext,
  records: Attendance[]
): Promise<{
  health: AttendanceHealth;
  missed_in_last_30_days: number;
}> {
  const settings = await getTenantSettings(ctx);
  const rp = settings.retention_pipeline ?? {};
  const warning = typeof rp.warning_threshold === "number" ? rp.warning_threshold : 1;
  const risk = typeof rp.risk_threshold === "number" ? rp.risk_threshold : 3;

  const now = new Date();
  const last30 = records.filter((r) => {
    const d = new Date(r.lesson_date);
    const diff = now.getTime() - d.getTime();
    const days = diff / (1000 * 60 * 60 * 24);
    return days >= 0 && days <= 30;
  });

  const missed = last30.filter((r) => !r.present).length;

  let health: AttendanceHealth = "healthy";
  if (missed >= warning && missed < risk) health = "warning";
  if (missed >= risk) health = "at_risk";

  return { health, missed_in_last_30_days: missed };
}

