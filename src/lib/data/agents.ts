import { getServiceClient } from "@/lib/supabase";
import { getSupabase } from "@/lib/agents/supabase";

export type FacadeResult<T> =
  | { data: T; error: null }
  | { data: null; error: { message: string; code?: string } };

export interface AgentRecord {
  id: string;
  slug?: string;
  name?: string;
  role?: string;
  tenant_id?: string;
  [key: string]: unknown;
}

function toErrorInfo(err: unknown): { message: string; code?: string } {
  if (err && typeof err === "object") {
    const anyErr = err as Record<string, unknown>;
    const message =
      typeof anyErr.message === "string"
        ? anyErr.message
        : typeof anyErr.error_description === "string"
          ? anyErr.error_description
          : "Unknown error";
    const code = typeof anyErr.code === "string" ? anyErr.code : undefined;
    return { message, ...(code ? { code } : {}) };
  }
  return { message: typeof err === "string" ? err : "Unknown error" };
}

/**
 * Read-only facade: list agents for a tenant.
 * Uses tenant-scoped Supabase client (x-tenant-id header).
 */
export async function getAgentsForTenant(
  tenantId: string
): Promise<FacadeResult<AgentRecord[]>> {
  try {
    const supabase = getSupabase(tenantId);
    const { data, error } = await supabase
      .from("agents")
      .select("*")
      .eq("tenant_id", tenantId);

    if (error) return { data: null, error: toErrorInfo(error) };
    return { data: (data || []) as AgentRecord[], error: null };
  } catch (err) {
    return { data: null, error: toErrorInfo(err) };
  }
}

/**
 * Read-only facade: fetch a single agent by id.
 * Uses service client to avoid tenant header requirements for direct lookups.
 */
export async function getAgentById(
  agentId: string
): Promise<FacadeResult<AgentRecord | null>> {
  try {
    const supabase = getServiceClient();
    const { data, error } = await supabase
      .from("agents")
      .select("*")
      .eq("id", agentId)
      .maybeSingle();

    if (error) return { data: null, error: toErrorInfo(error) };
    return { data: (data ?? null) as AgentRecord | null, error: null };
  } catch (err) {
    return { data: null, error: toErrorInfo(err) };
  }
}

