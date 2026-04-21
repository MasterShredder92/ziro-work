function store() {
    const g = globalThis;
    if (!g.__ziroAgentMemory) {
        g.__ziroAgentMemory = new Map();
    }
    return g.__ziroAgentMemory;
}
function ensureSerializable(value) {
    const serialized = JSON.stringify(value);
    if (serialized === undefined) {
        throw new Error("appendMemory: value is not JSON-serializable");
    }
    return JSON.parse(serialized);
}
function normalizeKey(id) {
    if (typeof id !== "string")
        return null;
    const trimmed = id.trim();
    return trimmed.length > 0 ? trimmed : null;
}
export function getMemory(conversationId) {
    const key = normalizeKey(conversationId);
    if (!key)
        return {};
    const existing = store().get(key);
    if (!existing)
        return {};
    return JSON.parse(JSON.stringify(existing));
}
export function appendMemory(conversationId, key, value) {
    var _a;
    const conv = normalizeKey(conversationId);
    if (!conv) {
        throw new Error("appendMemory: conversationId is required");
    }
    if (typeof key !== "string" || key.trim().length === 0) {
        throw new Error("appendMemory: key is required");
    }
    const safe = ensureSerializable(value);
    const map = store();
    const current = (_a = map.get(conv)) !== null && _a !== void 0 ? _a : {};
    const next = Object.assign(Object.assign({}, current), { [key]: safe });
    map.set(conv, next);
    return JSON.parse(JSON.stringify(next));
}
export function clearMemory(conversationId) {
    const key = normalizeKey(conversationId);
    if (!key)
        return;
    store().delete(key);
}
export function listMemoryKeys() {
    return Array.from(store().keys());
}
