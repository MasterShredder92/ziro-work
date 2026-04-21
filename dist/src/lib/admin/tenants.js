import { serviceClient } from "@data/index";
export async function listAdminTenants() {
    try {
        const supabase = serviceClient();
        const { data, error } = await supabase
            .from("tenants")
            .select("id, name")
            .order("name", { ascending: true })
            .limit(100);
        if (error)
            throw error;
        return (data !== null && data !== void 0 ? data : []).map((row) => {
            var _a;
            return ({
                id: String(row.id),
                name: String((_a = row.name) !== null && _a !== void 0 ? _a : row.id),
            });
        });
    }
    catch (_a) {
        return [];
    }
}
export async function listAdminLocations(tenantId) {
    try {
        const supabase = serviceClient();
        const { data, error } = await supabase
            .from("locations")
            .select("*")
            .eq("tenant_id", tenantId)
            .order("name", { ascending: true });
        if (error)
            throw error;
        return (data !== null && data !== void 0 ? data : []).map((row) => {
            var _a, _b, _c, _d, _e, _f, _g, _h, _j;
            return ({
                id: String(row.id),
                tenant_id: String((_a = row.tenant_id) !== null && _a !== void 0 ? _a : tenantId),
                name: String((_b = row.name) !== null && _b !== void 0 ? _b : row.id),
                slug: (_c = row.slug) !== null && _c !== void 0 ? _c : null,
                address: (_d = row.address) !== null && _d !== void 0 ? _d : null,
                city: (_e = row.city) !== null && _e !== void 0 ? _e : null,
                region: (_f = row.region) !== null && _f !== void 0 ? _f : null,
                postal_code: (_g = row.postal_code) !== null && _g !== void 0 ? _g : null,
                timezone: (_h = row.timezone) !== null && _h !== void 0 ? _h : null,
                active: (_j = row.active) !== null && _j !== void 0 ? _j : true,
            });
        });
    }
    catch (_a) {
        return [];
    }
}
