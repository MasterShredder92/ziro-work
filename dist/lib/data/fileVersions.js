import { clientFor } from "./_client";
import { isMissingTableError, markTableMissing, tableMissing } from "./_missingTable";
const TABLE = "file_versions";
function store() {
    const g = globalThis;
    if (!g.__ziro_file_versions)
        g.__ziro_file_versions = new Map();
    return g.__ziro_file_versions;
}
function uuid() {
    const c = globalThis.crypto;
    if (c === null || c === void 0 ? void 0 : c.randomUUID)
        return c.randomUUID();
    return `fver_${Math.random().toString(36).slice(2)}_${Date.now()}`;
}
function nowIso() {
    return new Date().toISOString();
}
function listFromStore(fileId, tenantId) {
    const out = [];
    for (const row of store().values()) {
        if (row.tenant_id === tenantId && row.file_id === fileId)
            out.push(row);
    }
    return out.sort((a, b) => b.version - a.version);
}
export async function listFileVersions(fileId, tenantId) {
    if (tableMissing(TABLE))
        return listFromStore(fileId, tenantId);
    try {
        const supabase = clientFor(tenantId);
        const { data, error } = await supabase
            .from(TABLE)
            .select("*")
            .eq("tenant_id", tenantId)
            .eq("file_id", fileId)
            .order("version", { ascending: false });
        if (error)
            throw error;
        return (data !== null && data !== void 0 ? data : []);
    }
    catch (err) {
        if (isMissingTableError(err, TABLE)) {
            markTableMissing(TABLE);
            return listFromStore(fileId, tenantId);
        }
        throw err;
    }
}
export async function getFileVersion(id, tenantId) {
    if (tableMissing(TABLE)) {
        const row = store().get(id);
        if (!row || row.tenant_id !== tenantId)
            return null;
        return row;
    }
    try {
        const supabase = clientFor(tenantId);
        const { data, error } = await supabase
            .from(TABLE)
            .select("*")
            .eq("tenant_id", tenantId)
            .eq("id", id)
            .maybeSingle();
        if (error)
            throw error;
        return (data !== null && data !== void 0 ? data : null);
    }
    catch (err) {
        if (isMissingTableError(err, TABLE)) {
            markTableMissing(TABLE);
            return getFileVersion(id, tenantId);
        }
        throw err;
    }
}
export async function createFileVersion(tenantId, input) {
    var _a, _b, _c, _d, _e, _f;
    const existing = await listFileVersions(input.file_id, tenantId);
    const nextVersion = (_a = input.version) !== null && _a !== void 0 ? _a : (existing.length > 0 ? Math.max(...existing.map((r) => r.version)) + 1 : 1);
    const next = {
        id: (_b = input.id) !== null && _b !== void 0 ? _b : uuid(),
        tenant_id: tenantId,
        file_id: input.file_id,
        version: nextVersion,
        storage_key: input.storage_key,
        storage_bucket: (_c = input.storage_bucket) !== null && _c !== void 0 ? _c : null,
        size: input.size,
        mime_type: input.mime_type,
        checksum: (_d = input.checksum) !== null && _d !== void 0 ? _d : null,
        uploaded_by: (_e = input.uploaded_by) !== null && _e !== void 0 ? _e : null,
        notes: (_f = input.notes) !== null && _f !== void 0 ? _f : null,
        created_at: nowIso(),
    };
    if (tableMissing(TABLE)) {
        store().set(next.id, next);
        return next;
    }
    try {
        const supabase = clientFor(tenantId);
        const { data, error } = await supabase
            .from(TABLE)
            .insert(next)
            .select("*")
            .single();
        if (error)
            throw error;
        return data;
    }
    catch (err) {
        if (isMissingTableError(err, TABLE)) {
            markTableMissing(TABLE);
            store().set(next.id, next);
            return next;
        }
        throw err;
    }
}
export async function deleteFileVersion(id, tenantId) {
    if (tableMissing(TABLE)) {
        const row = store().get(id);
        if (row && row.tenant_id === tenantId)
            store().delete(id);
        return;
    }
    try {
        const supabase = clientFor(tenantId);
        const { error } = await supabase
            .from(TABLE)
            .delete()
            .eq("tenant_id", tenantId)
            .eq("id", id);
        if (error)
            throw error;
    }
    catch (err) {
        if (isMissingTableError(err, TABLE)) {
            markTableMissing(TABLE);
            return deleteFileVersion(id, tenantId);
        }
        throw err;
    }
}
