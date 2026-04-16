import type { AgentContext } from "../agents/types";
import { getTenantSettings } from "./getTenantSettings";

export async function logTenantEvent(
  ctx: AgentContext,
  event: { type: string; payload?: unknown; tenantId: string }
): Promise<{ success?: boolean; skipped?: boolean } | void> {
  const settings = await getTenantSettings(ctx);
  const disabled = settings.events?.disabled ?? [];
  if (disabled.includes(event.type)) return { skipped: true };

  const { error } = await ctx.supabase.from("events").insert({
    type: event.type,
    payload: event.payload ?? {},
    tenant_id: event.tenantId,
    timestamp: new Date().toISOString(),
  });

  if (error) throw error;
  return { success: true };
}
