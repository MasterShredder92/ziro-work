import { toErrorInfo } from "./core";
import { getServiceClient } from "@/lib/supabase";
export async function getTenantSettingsByTenantId(client, tenantId) {
    try {
        const { data, error } = await client
            .from("tenant_settings")
            .select("*")
            .eq("tenant_id", tenantId)
            .maybeSingle();
        if (error)
            return { data: null, error: toErrorInfo(error) };
        return { data: (data !== null && data !== void 0 ? data : null), error: null };
    }
    catch (err) {
        return { data: null, error: toErrorInfo(err) };
    }
}
/**
 * Fetch tenant settings by tenant ID using the service client.
 * Used by the admin settings layer (no DbClient injection needed).
 */
export async function getTenantSettings(tenantId) {
    const db = getServiceClient();
    const { data, error } = await db
        .from("tenant_settings")
        .select("*")
        .eq("tenant_id", tenantId)
        .maybeSingle();
    if (error)
        throw new Error(error.message);
    if (!data) {
        return {
            tenant_id: tenantId,
            lead_pipeline: null,
            trial_pipeline: null,
            enrollment_pipeline: null,
            retention_pipeline: null,
            kpi_settings: null,
            schedule: null,
            pipelines: null,
            events: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        };
    }
    return data;
}
/**
 * Update (upsert) tenant settings for a given tenant.
 * Merges the patch into the existing JSONB fields.
 */
export async function updateTenantSettings(tenantId, patch) {
    var _a;
    const db = getServiceClient();
    const current = await getTenantSettings(tenantId);
    function mergeJson(existing, incoming) {
        if (incoming !== null &&
            incoming !== undefined &&
            typeof incoming === "object" &&
            !Array.isArray(incoming) &&
            existing !== null &&
            existing !== undefined &&
            typeof existing === "object" &&
            !Array.isArray(existing)) {
            return Object.assign(Object.assign({}, existing), incoming);
        }
        return incoming !== undefined ? incoming : existing;
    }
    const merged = {
        tenant_id: tenantId,
        lead_pipeline: mergeJson(current.lead_pipeline, patch.lead_pipeline),
        trial_pipeline: mergeJson(current.trial_pipeline, patch.trial_pipeline),
        enrollment_pipeline: mergeJson(current.enrollment_pipeline, patch.enrollment_pipeline),
        retention_pipeline: mergeJson(current.retention_pipeline, patch.retention_pipeline),
        kpi_settings: mergeJson(current.kpi_settings, patch.kpi_settings),
        schedule: mergeJson(current.schedule, patch.schedule),
        pipelines: mergeJson(current.pipelines, patch.pipelines),
        events: mergeJson(current.events, patch.events),
        updated_at: new Date().toISOString(),
        updated_by: (_a = patch.updated_by) !== null && _a !== void 0 ? _a : null,
    };
    const { data, error } = await db
        .from("tenant_settings")
        .upsert(merged, { onConflict: "tenant_id" })
        .select("*")
        .single();
    if (error)
        throw new Error(error.message);
    return data;
}
