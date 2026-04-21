const MAX_BUFFER = 200;
const g = globalThis;
function getBuffer() {
    if (!g.__ziro_telemetry_buffer)
        g.__ziro_telemetry_buffer = [];
    return g.__ziro_telemetry_buffer;
}
function push(event) {
    const buffer = getBuffer();
    buffer.push(event);
    if (buffer.length > MAX_BUFFER) {
        buffer.splice(0, buffer.length - MAX_BUFFER);
    }
}
export function recordSkillInvocation(params) {
    var _a, _b, _c, _d, _e, _f;
    const event = {
        kind: "invocation",
        timestamp: new Date().toISOString(),
        agentId: (_a = params.agentId) !== null && _a !== void 0 ? _a : null,
        skillId: (_b = params.skillId) !== null && _b !== void 0 ? _b : null,
        conversationId: (_c = params.conversationId) !== null && _c !== void 0 ? _c : null,
        profileId: (_d = params.profileId) !== null && _d !== void 0 ? _d : null,
        input: params.input,
        output: params.output,
        toolCalls: (_e = params.toolCalls) !== null && _e !== void 0 ? _e : [],
        usage: (_f = params.usage) !== null && _f !== void 0 ? _f : null,
    };
    push(event);
    return event;
}
function normalizeError(error) {
    var _a, _b;
    if (error instanceof Error) {
        return {
            message: error.message,
            stack: (_a = error.stack) !== null && _a !== void 0 ? _a : null,
            name: (_b = error.name) !== null && _b !== void 0 ? _b : null,
        };
    }
    if (typeof error === "string") {
        return { message: error, stack: null, name: null };
    }
    try {
        return { message: JSON.stringify(error), stack: null, name: null };
    }
    catch (_c) {
        return { message: String(error), stack: null, name: null };
    }
}
export function recordError(params) {
    var _a, _b, _c, _d;
    const normalized = normalizeError(params.error);
    const event = {
        kind: "error",
        timestamp: new Date().toISOString(),
        agentId: (_a = params.agentId) !== null && _a !== void 0 ? _a : null,
        skillId: (_b = params.skillId) !== null && _b !== void 0 ? _b : null,
        conversationId: (_c = params.conversationId) !== null && _c !== void 0 ? _c : null,
        profileId: (_d = params.profileId) !== null && _d !== void 0 ? _d : null,
        message: normalized.message,
        stack: normalized.stack,
        name: normalized.name,
    };
    push(event);
    return event;
}
export function getRecentTelemetry(limit = 100) {
    const buffer = getBuffer();
    if (limit <= 0)
        return [];
    if (limit >= buffer.length)
        return buffer.slice();
    return buffer.slice(buffer.length - limit);
}
export function clearTelemetry() {
    const buffer = getBuffer();
    buffer.length = 0;
}
