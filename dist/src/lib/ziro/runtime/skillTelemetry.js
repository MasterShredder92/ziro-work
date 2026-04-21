const MAX_BUFFER = 500;
const g = globalThis;
function getBuffer() {
    if (!g.__ziro_skill_exec_buffer)
        g.__ziro_skill_exec_buffer = [];
    return g.__ziro_skill_exec_buffer;
}
function nextId() {
    var _a;
    g.__ziro_skill_exec_counter = ((_a = g.__ziro_skill_exec_counter) !== null && _a !== void 0 ? _a : 0) + 1;
    return `skx_${Date.now().toString(36)}_${g.__ziro_skill_exec_counter.toString(36)}`;
}
function push(record) {
    const buffer = getBuffer();
    buffer.push(record);
    if (buffer.length > MAX_BUFFER) {
        buffer.splice(0, buffer.length - MAX_BUFFER);
    }
    return record;
}
export function recordSkillStart(input) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j;
    const record = {
        id: nextId(),
        phase: "start",
        agentId: (_a = input.agentId) !== null && _a !== void 0 ? _a : null,
        agentSlug: (_b = input.agentSlug) !== null && _b !== void 0 ? _b : null,
        skillId: (_c = input.skillId) !== null && _c !== void 0 ? _c : null,
        skillKey: (_d = input.skillKey) !== null && _d !== void 0 ? _d : null,
        source: (_e = input.source) !== null && _e !== void 0 ? _e : null,
        conversationId: (_f = input.conversationId) !== null && _f !== void 0 ? _f : null,
        profileId: (_g = input.profileId) !== null && _g !== void 0 ? _g : null,
        tenantId: (_h = input.tenantId) !== null && _h !== void 0 ? _h : null,
        startedAt: new Date().toISOString(),
        endedAt: null,
        durationMs: null,
        error: null,
        metadata: (_j = input.metadata) !== null && _j !== void 0 ? _j : null,
    };
    return push(record);
}
export function recordSkillSuccess(input) {
    var _a, _b;
    const endedAt = new Date();
    const started = new Date(input.start.startedAt).getTime();
    const record = Object.assign(Object.assign({}, input.start), { id: `${input.start.id}.ok`, phase: "success", endedAt: endedAt.toISOString(), durationMs: Math.max(0, endedAt.getTime() - started), error: null, metadata: Object.assign(Object.assign({}, ((_a = input.start.metadata) !== null && _a !== void 0 ? _a : {})), ((_b = input.metadata) !== null && _b !== void 0 ? _b : {})) });
    return push(record);
}
function normalizeError(error) {
    var _a, _b, _c;
    if (error instanceof Error) {
        return {
            name: (_a = error.name) !== null && _a !== void 0 ? _a : null,
            message: (_b = error.message) !== null && _b !== void 0 ? _b : String(error),
            stack: (_c = error.stack) !== null && _c !== void 0 ? _c : null,
        };
    }
    if (typeof error === "string") {
        return { name: null, message: error, stack: null };
    }
    try {
        return { name: null, message: JSON.stringify(error), stack: null };
    }
    catch (_d) {
        return { name: null, message: String(error), stack: null };
    }
}
export function recordSkillFailure(input) {
    var _a, _b;
    const endedAt = new Date();
    const started = new Date(input.start.startedAt).getTime();
    const normalized = normalizeError(input.error);
    const record = Object.assign(Object.assign({}, input.start), { id: `${input.start.id}.err`, phase: "failure", endedAt: endedAt.toISOString(), durationMs: Math.max(0, endedAt.getTime() - started), error: normalized, metadata: Object.assign(Object.assign({}, ((_a = input.start.metadata) !== null && _a !== void 0 ? _a : {})), ((_b = input.metadata) !== null && _b !== void 0 ? _b : {})) });
    return push(record);
}
export function getRecentSkillExecutions(limit = 100) {
    const buffer = getBuffer();
    if (limit <= 0)
        return [];
    if (limit >= buffer.length)
        return buffer.slice();
    return buffer.slice(buffer.length - limit);
}
export function clearSkillExecutions() {
    const buffer = getBuffer();
    buffer.length = 0;
}
