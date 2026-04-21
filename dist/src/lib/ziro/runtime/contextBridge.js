import { getMemory } from "@/lib/ziro/context/memory";
import { extractPageContext, } from "@/lib/ziro/context/pageContext";
function normalizeConversationId(value) {
    if (typeof value !== "string")
        return null;
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
}
export async function buildTurnContext(input) {
    var _a, _b;
    const conversationId = normalizeConversationId(input.conversationId);
    const [memory, page] = await Promise.all([
        Promise.resolve(getMemory(conversationId !== null && conversationId !== void 0 ? conversationId : "")),
        extractPageContext({
            pathname: (_a = input.pathname) !== null && _a !== void 0 ? _a : null,
            searchParams: (_b = input.searchParams) !== null && _b !== void 0 ? _b : null,
        }),
    ]);
    return {
        conversationId,
        timestamp: new Date().toISOString(),
        memory,
        page,
    };
}
