function safeStringify(value) {
    try {
        const out = JSON.stringify(value);
        return typeof out === "string" ? out : "{}";
    }
    catch (_a) {
        return "{}";
    }
}
function trimString(value) {
    if (typeof value !== "string")
        return null;
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
}
export function buildSystemPrompt(input) {
    var _a, _b;
    const { agent, skill, turnContext } = input;
    const parts = [];
    const agentPrompt = trimString((_a = agent === null || agent === void 0 ? void 0 : agent.systemPrompt) !== null && _a !== void 0 ? _a : null);
    if (agentPrompt)
        parts.push(agentPrompt);
    const skillDescription = trimString((_b = skill === null || skill === void 0 ? void 0 : skill.description) !== null && _b !== void 0 ? _b : null);
    if (skillDescription)
        parts.push(skillDescription);
    const pageJson = safeStringify(turnContext.page);
    parts.push(`PAGE_CONTEXT:\n${pageJson}`);
    const memoryJson = safeStringify(turnContext.memory);
    parts.push(`AGENT_MEMORY:\n${memoryJson}`);
    return parts.join("\n\n");
}
