import { clientFor } from "./_client";
const TABLE = "family_files";
export async function listFilesForFamily(tenantId, familyId) {
    const supabase = clientFor(tenantId);
    const { data, error } = await supabase
        .from(TABLE)
        .select("*")
        .eq("tenant_id", tenantId)
        .eq("family_id", familyId)
        .order("created_at", { ascending: false });
    if (error)
        throw error;
    return (data !== null && data !== void 0 ? data : []);
}
