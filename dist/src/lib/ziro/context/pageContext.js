import { getPageBindings, } from "@/lib/ziro/runtime/pageIntelligence";
import { CONTEXT_LOADERS, CONTEXT_LOADER_ID_KEYS, isContextLoaderName, } from "./loaders";
export function pageKeyFromPath(pathname) {
    if (!pathname)
        return "dashboard";
    const trimmed = pathname.replace(/^\/+|\/+$/g, "");
    if (trimmed.length === 0)
        return "dashboard";
    const first = trimmed.split("/")[0];
    return first || "dashboard";
}
function normalizePath(pathname) {
    if (!pathname)
        return "/";
    const trimmed = pathname.trim();
    if (trimmed.length === 0)
        return "/";
    return trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
}
function readParam(params, key) {
    if (!params)
        return null;
    if (params instanceof URLSearchParams) {
        const value = params.get(key);
        if (typeof value !== "string")
            return null;
        const trimmed = value.trim();
        return trimmed.length > 0 ? trimmed : null;
    }
    const raw = params[key];
    if (Array.isArray(raw)) {
        for (const entry of raw) {
            if (typeof entry === "string" && entry.trim().length > 0) {
                return entry.trim();
            }
        }
        return null;
    }
    if (typeof raw !== "string")
        return null;
    const trimmed = raw.trim();
    return trimmed.length > 0 ? trimmed : null;
}
function firstParam(params, keys) {
    for (const key of keys) {
        const value = readParam(params, key);
        if (value)
            return value;
    }
    return null;
}
export async function extractPageContext(input) {
    var _a;
    const pathname = normalizePath(input.pathname);
    const bindings = getPageBindings(pathname);
    const pageKey = pageKeyFromPath(pathname);
    const searchParams = (_a = input.searchParams) !== null && _a !== void 0 ? _a : null;
    const loaderNames = [];
    for (const name of bindings.contextLoaders) {
        if (isContextLoaderName(name) && !loaderNames.includes(name)) {
            loaderNames.push(name);
        }
    }
    const loaded = await Promise.all(loaderNames.map(async (name) => {
        const loader = CONTEXT_LOADERS[name];
        const idKeys = CONTEXT_LOADER_ID_KEYS[name];
        const id = firstParam(searchParams, idKeys);
        if (!id)
            return [name, null];
        try {
            const value = await loader(id);
            return [name, value];
        }
        catch (_a) {
            return [name, null];
        }
    }));
    const context = {};
    for (const [name, value] of loaded) {
        context[name] = value;
    }
    return {
        pageKey,
        agent: bindings.agent,
        pathname,
        bindings,
        context,
        quickActions: [...bindings.skills],
    };
}
