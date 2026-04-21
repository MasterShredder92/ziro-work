const STORAGE_KEY = "ziro:agentOS:eventLog";
const MAX_STORED = 120;
function isRecord(value) {
    if (!value || typeof value !== "object")
        return false;
    const row = value;
    return (typeof row.id === "string" &&
        typeof row.at === "number" &&
        typeof row.agentId === "string" &&
        typeof row.actionId === "string" &&
        typeof row.label === "string" &&
        (row.level === "info" || row.level === "success" || row.level === "warning" || row.level === "error"));
}
function makeId() {
    if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
        return crypto.randomUUID();
    }
    return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}
export function loadAgentOSEventLog() {
    if (typeof window === "undefined")
        return [];
    try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (!raw)
            return [];
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed))
            return [];
        return parsed.filter(isRecord).sort((a, b) => b.at - a.at).slice(0, MAX_STORED);
    }
    catch (_a) {
        return [];
    }
}
export function saveAgentOSEventLog(rows) {
    if (typeof window === "undefined")
        return;
    try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(rows.slice(0, MAX_STORED)));
    }
    catch (_a) {
        /* ignore storage errors */
    }
}
export function appendAgentOSEvent(prev, entry) {
    var _a;
    const next = Object.assign(Object.assign({}, entry), { id: makeId(), at: (_a = entry.at) !== null && _a !== void 0 ? _a : Date.now() });
    return [next, ...prev].slice(0, MAX_STORED);
}
