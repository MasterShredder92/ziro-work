/**
 * Shared helpers for data facades that can tolerate missing Postgres tables —
 * useful during incremental schema rollouts. When a table does not yet exist,
 * we fall back to an in-memory store so the UI can still render.
 */
export function isMissingTableError(err, table) {
    if (!err || typeof err !== "object")
        return false;
    const rec = err;
    const code = typeof rec.code === "string" ? rec.code : null;
    const message = typeof rec.message === "string" ? rec.message : "";
    if (code === "42P01")
        return true;
    if (code === "PGRST205")
        return true;
    const esc = table.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const rel = new RegExp(`relation .*${esc}.* does not exist`, "i");
    const pgrst = new RegExp(`Could not find the table .*${esc}`, "i");
    if (rel.test(message))
        return true;
    if (pgrst.test(message))
        return true;
    return false;
}
const globalFlags = globalThis;
export function markTableMissing(table) {
    const key = `__ziro_table_missing__${table}`;
    globalFlags[key] = true;
}
export function tableMissing(table) {
    const key = `__ziro_table_missing__${table}`;
    return globalFlags[key] === true;
}
