import { findToolInPacks, toolPacks, } from "@/lib/ziro/tools";
const g = globalThis;
function getRegistry() {
    if (!g.__ziro_runtime_tool_registry)
        g.__ziro_runtime_tool_registry = new Map();
    return g.__ziro_runtime_tool_registry;
}
export function registerTool(definition) {
    if (!(definition === null || definition === void 0 ? void 0 : definition.name))
        throw new Error("registerTool: name is required");
    if (typeof definition.handler !== "function")
        throw new Error("registerTool: handler must be a function");
    getRegistry().set(definition.name, definition);
}
export function unregisterTool(name) {
    getRegistry().delete(name);
}
export function hasTool(name) {
    if (getRegistry().has(name))
        return true;
    return !!findToolInPacks(name);
}
export function resolveTool(name) {
    var _a;
    const packTool = findToolInPacks(name);
    if (packTool)
        return packTool;
    return (_a = getRegistry().get(name)) !== null && _a !== void 0 ? _a : null;
}
export function listRegisteredTools() {
    const reg = Array.from(getRegistry().values());
    const packDefs = Object.values(toolPacks).flatMap((p) => Object.values(p));
    const seen = new Set();
    const out = [];
    for (const def of [...packDefs, ...reg]) {
        if (seen.has(def.name))
            continue;
        seen.add(def.name);
        out.push(def);
    }
    return out;
}
export async function executeTool(name, input) {
    const tool = resolveTool(name);
    if (!tool)
        throw new Error(`Unknown tool: ${name}`);
    return tool.handler(input);
}
export async function safeExecuteTool(name, input) {
    var _a, _b;
    try {
        const output = await executeTool(name, input);
        return { ok: true, output };
    }
    catch (error) {
        if (error instanceof Error) {
            return {
                ok: false,
                error: {
                    message: error.message,
                    name: (_a = error.name) !== null && _a !== void 0 ? _a : null,
                    stack: (_b = error.stack) !== null && _b !== void 0 ? _b : null,
                },
            };
        }
        return {
            ok: false,
            error: {
                message: typeof error === "string" ? error : JSON.stringify(error),
                name: null,
                stack: null,
            },
        };
    }
}
