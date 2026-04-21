import { anthropic } from "@/lib/anthropic";
import { clientFor } from "@data/_client";
import { appendAIMessage, createAIConversation, getAIConversationById, listAIMessages, } from "@data/aiConversations";
import { resolveAgent, touchAgentUsage } from "./agentRegistry";
import { resolvePageBindings } from "./pageIntelligence";
import { touchSkillUsage } from "./skillRegistry";
import { getToolsForAgent } from "./tools/definitions";
import { executeTool } from "./tools/executor";
const DEFAULT_MODEL = "claude-sonnet-4-5-20250929";
function asJsonObject(value) {
    if (value && typeof value === "object" && !Array.isArray(value)) {
        return value;
    }
    return {};
}
async function ensureConversation(input) {
    var _a, _b;
    if (input.conversationId) {
        const existing = await getAIConversationById(input.conversationId, input.tenantId);
        if (existing)
            return existing;
    }
    return createAIConversation(input.tenantId, {
        profile_id: input.profileId,
        client_route: (_a = input.pathname) !== null && _a !== void 0 ? _a : null,
        source: "ziro",
        metadata: ((_b = input.metadata) !== null && _b !== void 0 ? _b : {}),
        page_context: (input.pageKey
            ? { page_key: input.pageKey }
            : {}),
    });
}
function buildSystemPrompt(parts) {
    const cleaned = parts
        .map((p) => (typeof p === "string" ? p.trim() : ""))
        .filter((p) => p.length > 0);
    if (cleaned.length === 0)
        return undefined;
    return cleaned.join("\n\n");
}
function extractTextFromContent(content) {
    return content
        .map((block) => {
        if (block.type === "text")
            return block.text;
        return "";
    })
        .filter(Boolean)
        .join("\n");
}
/** Run the agentic tool loop: call LLM, execute tools, repeat until text response */
async function runAgenticLoop(model, maxTokens, temperature, system, messages, tools, tenantId) {
    const currentMessages = [...messages];
    let totalUsage = null;
    // Max 5 tool call rounds to prevent infinite loops
    for (let round = 0; round < 5; round++) {
        const completion = await anthropic.messages.create(Object.assign({ model, max_tokens: maxTokens, temperature,
            system, messages: currentMessages }, (tools.length > 0 ? { tools } : {})));
        // Accumulate usage — spread full Usage object to satisfy type
        totalUsage = totalUsage
            ? Object.assign(Object.assign({}, completion.usage), { input_tokens: totalUsage.input_tokens + completion.usage.input_tokens, output_tokens: totalUsage.output_tokens + completion.usage.output_tokens }) : completion.usage;
        // If no tool calls, return the text response
        if (completion.stop_reason !== "tool_use") {
            return {
                text: extractTextFromContent(completion.content),
                usage: totalUsage !== null && totalUsage !== void 0 ? totalUsage : completion.usage,
            };
        }
        // Process tool calls
        const toolUseBlocks = completion.content.filter((b) => b.type === "tool_use");
        if (toolUseBlocks.length === 0) {
            return {
                text: extractTextFromContent(completion.content),
                usage: totalUsage !== null && totalUsage !== void 0 ? totalUsage : completion.usage,
            };
        }
        // Add assistant message with tool calls to history
        currentMessages.push({
            role: "assistant",
            content: completion.content,
        });
        // Execute all tool calls and collect results
        const toolResults = await Promise.all(toolUseBlocks.map(async (block) => {
            const result = await executeTool(block.name, block.input, tenantId);
            return {
                type: "tool_result",
                tool_use_id: block.id,
                content: JSON.stringify(result),
            };
        }));
        // Add tool results to history
        currentMessages.push({
            role: "user",
            content: toolResults,
        });
    }
    // Fallback: ask for final response without tools
    const finalCompletion = await anthropic.messages.create({
        model,
        max_tokens: maxTokens,
        temperature,
        system,
        messages: currentMessages,
    });
    totalUsage = totalUsage
        ? Object.assign(Object.assign({}, finalCompletion.usage), { input_tokens: totalUsage.input_tokens + finalCompletion.usage.input_tokens, output_tokens: totalUsage.output_tokens + finalCompletion.usage.output_tokens }) : finalCompletion.usage;
    return {
        text: extractTextFromContent(finalCompletion.content),
        usage: totalUsage !== null && totalUsage !== void 0 ? totalUsage : finalCompletion.usage,
    };
}
export async function runTurn(input) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l;
    const conversation = await ensureConversation(input);
    const [agent, pageResolution] = await Promise.all([
        input.agentId || input.agentName
            ? resolveAgent({ id: input.agentId, name: input.agentName }, input.tenantId)
            : Promise.resolve(null),
        input.pathname || input.pageKey
            ? resolvePageBindings({ pathname: input.pathname, pageKey: input.pageKey }, input.tenantId)
            : Promise.resolve(null),
    ]);
    const effectiveAgent = agent !== null && agent !== void 0 ? agent : ((pageResolution === null || pageResolution === void 0 ? void 0 : pageResolution.primaryAgent) ? Object.assign(Object.assign({}, pageResolution.primaryAgent), { skills: [] }) : null);
    const skill = input.skillKey && effectiveAgent && "skills" in effectiveAgent
        ? (_a = effectiveAgent.skills.find((s) => s.key === input.skillKey)) !== null && _a !== void 0 ? _a : null
        : null;
    const history = await listAIMessages(conversation.id, input.tenantId, {
        limit: 40,
    });
    const userMessage = await appendAIMessage(input.tenantId, {
        conversation_id: conversation.id,
        profile_id: input.profileId,
        role: "user",
        content: input.input,
        metadata: ((_b = input.metadata) !== null && _b !== void 0 ? _b : {}),
    });
    const priorTurns = history
        .filter((m) => m.role === "user" || m.role === "assistant")
        .map((m) => {
        var _a;
        return ({
            role: m.role,
            content: (_a = m.content) !== null && _a !== void 0 ? _a : "",
        });
    });
    const system = buildSystemPrompt([
        effectiveAgent === null || effectiveAgent === void 0 ? void 0 : effectiveAgent.instructions,
        effectiveAgent && "business_context" in effectiveAgent
            ? effectiveAgent.business_context
            : null,
        skill === null || skill === void 0 ? void 0 : skill.system_prompt_fragment,
        // Tool usage instructions appended to system prompt
        `You have access to tools that let you take real actions in ZiroWork. When a user asks you to update a student, reschedule a lesson, or look up information — USE THE TOOLS. Do not ask the user to do it themselves. Do not say you "can't" do something if you have a tool for it. Execute the action, confirm what you did, and show the result.`,
    ]);
    // Get tools for this agent
    const agentName = (_c = effectiveAgent === null || effectiveAgent === void 0 ? void 0 : effectiveAgent.name) !== null && _c !== void 0 ? _c : null;
    const tools = getToolsForAgent(agentName);
    const messages = [
        ...priorTurns,
        { role: "user", content: input.input },
    ];
    const { text: assistantText, usage } = await runAgenticLoop((_d = input.model) !== null && _d !== void 0 ? _d : DEFAULT_MODEL, (_e = input.maxTokens) !== null && _e !== void 0 ? _e : 1024, input.temperature, system, messages, tools, input.tenantId);
    const assistantMessage = await appendAIMessage(input.tenantId, {
        conversation_id: conversation.id,
        profile_id: input.profileId,
        role: "assistant",
        content: assistantText,
        model: (_f = input.model) !== null && _f !== void 0 ? _f : DEFAULT_MODEL,
        usage: (_g = usage) !== null && _g !== void 0 ? _g : null,
        metadata: asJsonObject({
            agent_id: (_h = effectiveAgent === null || effectiveAgent === void 0 ? void 0 : effectiveAgent.id) !== null && _h !== void 0 ? _h : null,
            skill_id: (_j = skill === null || skill === void 0 ? void 0 : skill.id) !== null && _j !== void 0 ? _j : null,
        }),
    });
    if (effectiveAgent) {
        await touchAgentUsage(effectiveAgent.id, input.tenantId).catch(() => undefined);
    }
    if (skill) {
        await touchSkillUsage(skill.id, input.tenantId).catch(() => undefined);
    }
    return {
        conversation,
        userMessage,
        assistantMessage,
        agentId: (_k = effectiveAgent === null || effectiveAgent === void 0 ? void 0 : effectiveAgent.id) !== null && _k !== void 0 ? _k : null,
        skillId: (_l = skill === null || skill === void 0 ? void 0 : skill.id) !== null && _l !== void 0 ? _l : null,
        usage: usage !== null && usage !== void 0 ? usage : null,
    };
}
export async function logAction(args) {
    var _a, _b, _c, _d, _e, _f;
    const supabase = clientFor(args.tenantId);
    await supabase.from("ai_action_logs").insert({
        tenant_id: args.tenantId,
        profile_id: args.profileId,
        action_id: args.actionId,
        ok: args.ok,
        conversation_id: (_a = args.conversationId) !== null && _a !== void 0 ? _a : null,
        idempotency_key: (_b = args.idempotencyKey) !== null && _b !== void 0 ? _b : null,
        payload: (_c = args.payload) !== null && _c !== void 0 ? _c : null,
        result: (_d = args.result) !== null && _d !== void 0 ? _d : null,
        error_code: (_e = args.errorCode) !== null && _e !== void 0 ? _e : null,
        error_message: (_f = args.errorMessage) !== null && _f !== void 0 ? _f : null,
    });
}
