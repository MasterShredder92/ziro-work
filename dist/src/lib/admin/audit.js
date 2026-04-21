import "server-only";
import { headers } from "next/headers";
import { getSession } from "@/lib/auth/session";
import { insertAuditLog, listAuditLogs, purgeOlderThan, } from "@data/auditLogs";
function isPlainObject(v) {
    return !!v && typeof v === "object" && !Array.isArray(v);
}
export function diffObjects(before, after, prefix = "") {
    const out = [];
    const b = before !== null && before !== void 0 ? before : {};
    const a = after !== null && after !== void 0 ? after : {};
    const keys = new Set([...Object.keys(b), ...Object.keys(a)]);
    for (const key of keys) {
        const path = prefix ? `${prefix}.${key}` : key;
        const bv = b[key];
        const av = a[key];
        if (isPlainObject(bv) && isPlainObject(av)) {
            out.push(...diffObjects(bv, av, path));
            continue;
        }
        if (JSON.stringify(bv !== null && bv !== void 0 ? bv : null) !== JSON.stringify(av !== null && av !== void 0 ? av : null)) {
            out.push({ path, before: bv !== null && bv !== void 0 ? bv : null, after: av !== null && av !== void 0 ? av : null });
        }
    }
    return out;
}
async function resolveActor() {
    var _a, _b, _c, _d, _e, _f;
    let actorId = null;
    let actorRole = null;
    try {
        const session = await getSession();
        actorId = (_a = session === null || session === void 0 ? void 0 : session.userId) !== null && _a !== void 0 ? _a : null;
        actorRole = (_b = session === null || session === void 0 ? void 0 : session.role) !== null && _b !== void 0 ? _b : null;
    }
    catch (_g) {
        actorId = null;
    }
    let ip = null;
    try {
        const h = await headers();
        ip =
            (_f = (_e = (_d = (_c = h.get("x-forwarded-for")) === null || _c === void 0 ? void 0 : _c.split(",")[0]) === null || _d === void 0 ? void 0 : _d.trim()) !== null && _e !== void 0 ? _e : h.get("x-real-ip")) !== null && _f !== void 0 ? _f : null;
    }
    catch (_h) {
        ip = null;
    }
    return { id: actorId, role: actorRole, ip };
}
export async function recordAudit(input) {
    var _a, _b, _c, _d, _e, _f, _g, _h;
    const actor = await resolveActor();
    const diff = input.before || input.after
        ? diffObjects((_a = input.before) !== null && _a !== void 0 ? _a : null, (_b = input.after) !== null && _b !== void 0 ? _b : null).map((d) => d)
        : null;
    return insertAuditLog(input.tenantId, {
        event: input.event,
        category: (_c = input.category) !== null && _c !== void 0 ? _c : null,
        actor_id: actor.id,
        actor_role: actor.role,
        actor_ip: actor.ip,
        target_type: (_d = input.targetType) !== null && _d !== void 0 ? _d : null,
        target_id: (_e = input.targetId) !== null && _e !== void 0 ? _e : null,
        before: (_f = input.before) !== null && _f !== void 0 ? _f : null,
        after: (_g = input.after) !== null && _g !== void 0 ? _g : null,
        diff,
        payload: (_h = input.payload) !== null && _h !== void 0 ? _h : null,
    });
}
export async function searchAudit(tenantId, filter = {}) {
    return listAuditLogs(tenantId, filter);
}
export async function applyRetentionPolicy(tenantId, retentionDays) {
    if (!retentionDays || retentionDays <= 0)
        return 0;
    const cutoff = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000).toISOString();
    return purgeOlderThan(tenantId, cutoff);
}
export function exportAuditCsv(rows) {
    const header = [
        "id",
        "created_at",
        "event",
        "category",
        "actor_id",
        "actor_role",
        "target_type",
        "target_id",
    ].join(",");
    const lines = rows.map((r) => {
        var _a, _b, _c, _d, _e;
        return [
            r.id,
            r.created_at,
            r.event,
            (_a = r.category) !== null && _a !== void 0 ? _a : "",
            (_b = r.actor_id) !== null && _b !== void 0 ? _b : "",
            (_c = r.actor_role) !== null && _c !== void 0 ? _c : "",
            (_d = r.target_type) !== null && _d !== void 0 ? _d : "",
            (_e = r.target_id) !== null && _e !== void 0 ? _e : "",
        ]
            .map((v) => typeof v === "string" && /[",\n]/.test(v)
            ? `"${v.replace(/"/g, '""')}"`
            : String(v !== null && v !== void 0 ? v : ""))
            .join(",");
    });
    return [header, ...lines].join("\n");
}
