import { anthropic } from "@/lib/anthropic";
import { getServiceClient } from "@/lib/supabase";
import { routeTask } from "@/lib/routing/routeTask";
import { resolveAgent } from "./agentRegistry";
import { resolveSkillOrPack, } from "./skillRegistry";
import { recordSkillStart, recordSkillSuccess, recordSkillFailure, } from "./skillTelemetry";
const DEFAULT_MODEL = "claude-sonnet-4-5-20250929";
const DEFAULT_MAX_TOKENS = 1024;
const HISTORY_LIMIT = 40;
function deriveTitle(input, override) {
    var _a;
    if (override && override.trim().length > 0)
        return override.trim().slice(0, 200);
    const firstLine = (_a = input.split(/\r?\n/).find((l) => l.trim().length > 0)) !== null && _a !== void 0 ? _a : "";
    const trimmed = firstLine.trim();
    if (trimmed.length === 0)
        return "Ziro conversation";
    return trimmed.length > 80 ? `${trimmed.slice(0, 77)}...` : trimmed;
}
async function loadThread(conversationId) {
    const supabase = getServiceClient();
    const { data, error } = await supabase
        .from("task_threads")
        .select("id, task_id, agent_id, parent_chat_id, thread_title, status, started_at, ended_at, summary, created_at")
        .eq("id", conversationId)
        .maybeSingle();
    if (error)
        throw error;
    return (data !== null && data !== void 0 ? data : null);
}
async function createThread(params) {
    const supabase = getServiceClient();
    const { data, error } = await supabase
        .from("task_threads")
        .insert({
        thread_title: params.title,
        agent_id: params.agentId,
        status: "open",
    })
        .select("id, task_id, agent_id, parent_chat_id, thread_title, status, started_at, ended_at, summary, created_at")
        .single();
    if (error)
        throw error;
    return data;
}
async function ensureThread(input, resolvedAgent) {
    var _a;
    if (input.conversationId) {
        const existing = await loadThread(input.conversationId);
        if (existing)
            return existing;
    }
    return createThread({
        title: deriveTitle(input.input, input.title),
        agentId: (_a = resolvedAgent === null || resolvedAgent === void 0 ? void 0 : resolvedAgent.id) !== null && _a !== void 0 ? _a : null,
    });
}
async function loadRecentMessages(threadId, limit) {
    const supabase = getServiceClient();
    const { data, error } = await supabase
        .from("task_messages")
        .select("id, thread_id, sender_type, sender_name, message_type, content, metadata, created_at")
        .eq("thread_id", threadId)
        .order("created_at", { ascending: false })
        .limit(limit);
    if (error)
        throw error;
    return (data !== null && data !== void 0 ? data : []).reverse();
}
async function insertMessage(params) {
    const supabase = getServiceClient();
    const { data, error } = await supabase
        .from("task_messages")
        .insert({
        thread_id: params.threadId,
        sender_type: params.senderType,
        sender_name: params.senderName,
        message_type: params.messageType,
        content: params.content,
        metadata: params.metadata,
    })
        .select("id, thread_id, sender_type, sender_name, message_type, content, metadata, created_at")
        .single();
    if (error)
        throw error;
    return data;
}
function rowToMessage(row) {
    const role = row.sender_type === "user" ? "user" : "assistant";
    return {
        id: row.id,
        conversationId: row.thread_id,
        role,
        content: row.content,
        createdAt: row.created_at,
    };
}
function toChatRole(senderType) {
    if (senderType === "user")
        return "user";
    if (senderType === "assistant")
        return "assistant";
    return null;
}
function buildPriorTurns(rows) {
    var _a;
    const turns = [];
    for (const row of rows) {
        const role = toChatRole(row.sender_type);
        if (!role)
            continue;
        const content = ((_a = row.content) !== null && _a !== void 0 ? _a : "").trim();
        if (content.length === 0)
            continue;
        turns.push({ role, content });
    }
    return turns;
}
function buildSystemPrompt(parts) {
    const cleaned = parts
        .map((p) => (typeof p === "string" ? p.trim() : ""))
        .filter((p) => p.length > 0);
    if (cleaned.length === 0)
        return undefined;
    return cleaned.join("\n\n");
}
function extractText(blocks) {
    return blocks
        .map((b) => (b.type === "text" ? b.text : ""))
        .filter(Boolean)
        .join("\n")
        .trim();
}
function extractToolCalls(blocks) {
    const calls = [];
    for (const block of blocks) {
        if (block.type === "tool_use") {
            calls.push({
                id: block.id,
                name: block.name,
                input: block.input,
            });
        }
    }
    return calls;
}
export async function runTurn(input) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z, _0, _1, _2, _3, _4, _5, _6, _7, _8, _9, _10, _11, _12, _13, _14, _15, _16, _17, _18;
    let skillExecution = null;
    try {
        if (!input || typeof input.input !== "string" || input.input.length === 0) {
            throw new Error("runTurn: 'input' string is required");
        }
        const businessContext = (_a = input.tenantId) !== null && _a !== void 0 ? _a : null;
        const resolvedAgent = input.agent
            ? await resolveAgent(input.agent, { businessContext })
            : null;
        const resolvedSkillOrPack = input.skill
            ? await resolveSkillOrPack(input.skill, { businessContext })
            : null;
        const resolvedSkill = (resolvedSkillOrPack === null || resolvedSkillOrPack === void 0 ? void 0 : resolvedSkillOrPack.source) === "db" ? resolvedSkillOrPack.skill : null;
        const packMatch = (resolvedSkillOrPack === null || resolvedSkillOrPack === void 0 ? void 0 : resolvedSkillOrPack.source) === "pack" ? resolvedSkillOrPack.match : null;
        const thread = await ensureThread(input, resolvedAgent);
        skillExecution = recordSkillStart({
            agentId: (_b = resolvedAgent === null || resolvedAgent === void 0 ? void 0 : resolvedAgent.id) !== null && _b !== void 0 ? _b : null,
            agentSlug: (_d = (_c = resolvedAgent === null || resolvedAgent === void 0 ? void 0 : resolvedAgent.slug) !== null && _c !== void 0 ? _c : packMatch === null || packMatch === void 0 ? void 0 : packMatch.agent) !== null && _d !== void 0 ? _d : null,
            skillId: (_e = resolvedSkill === null || resolvedSkill === void 0 ? void 0 : resolvedSkill.id) !== null && _e !== void 0 ? _e : null,
            skillKey: (_g = (_f = resolvedSkill === null || resolvedSkill === void 0 ? void 0 : resolvedSkill.slug) !== null && _f !== void 0 ? _f : resolvedSkill === null || resolvedSkill === void 0 ? void 0 : resolvedSkill.key) !== null && _g !== void 0 ? _g : (packMatch ? `${packMatch.agent}.${packMatch.key}` : (_h = input.skill) !== null && _h !== void 0 ? _h : null),
            source: packMatch ? "pack" : resolvedSkill ? "db" : null,
            conversationId: thread.id,
            profileId: (_j = input.profileId) !== null && _j !== void 0 ? _j : null,
            tenantId: (_k = input.tenantId) !== null && _k !== void 0 ? _k : null,
            metadata: {
                skillTitle: (_m = (_l = packMatch === null || packMatch === void 0 ? void 0 : packMatch.definition.title) !== null && _l !== void 0 ? _l : resolvedSkill === null || resolvedSkill === void 0 ? void 0 : resolvedSkill.name) !== null && _m !== void 0 ? _m : null,
            },
        });
        const title = deriveTitle(input.input, input.title);
        const history = await loadRecentMessages(thread.id, HISTORY_LIMIT);
        const userRow = await insertMessage({
            threadId: thread.id,
            senderType: "user",
            senderName: (_o = input.profileId) !== null && _o !== void 0 ? _o : null,
            messageType: "instruction",
            content: input.input,
            metadata: Object.assign(Object.assign({}, ((_p = input.metadata) !== null && _p !== void 0 ? _p : {})), { agent_hint: (_q = input.agent) !== null && _q !== void 0 ? _q : null, skill_hint: (_r = input.skill) !== null && _r !== void 0 ? _r : null, tenant_id: (_s = input.tenantId) !== null && _s !== void 0 ? _s : null, profile_id: (_t = input.profileId) !== null && _t !== void 0 ? _t : null }),
        });
        if (packMatch) {
            const packOutput = await packMatch.definition.handler({
                input: input.input,
                tenantId: (_u = input.tenantId) !== null && _u !== void 0 ? _u : "",
                profileId: (_v = input.profileId) !== null && _v !== void 0 ? _v : "",
                conversationId: thread.id,
            });
            const packToolCalls = Array.isArray(packOutput.toolCalls)
                ? packOutput.toolCalls
                : [];
            const payload = packOutput.result;
            const assistantContent = typeof payload === "string" ? payload : JSON.stringify(payload, null, 2);
            const packAgentSlug = (_w = resolvedAgent === null || resolvedAgent === void 0 ? void 0 : resolvedAgent.slug) !== null && _w !== void 0 ? _w : packMatch.agent;
            const packAssistantMetadata = {
                agent_id: (_x = resolvedAgent === null || resolvedAgent === void 0 ? void 0 : resolvedAgent.id) !== null && _x !== void 0 ? _x : null,
                agent_slug: packAgentSlug,
                skill_id: null,
                skill_slug: null,
                skill_pack: packMatch.agent,
                skill_key: packMatch.key,
                skill_title: packMatch.definition.title,
                runtime: "skill_pack",
                routing_reason: "skill_pack_match",
                routing_score: null,
                stop_reason: null,
                model: "ziro-skillpack",
                usage: null,
                tool_calls: packToolCalls,
                source: "pack",
                handler_metadata: (_y = packOutput.metadata) !== null && _y !== void 0 ? _y : null,
            };
            const packAssistantRow = await insertMessage({
                threadId: thread.id,
                senderType: "assistant",
                senderName: (_z = resolvedAgent === null || resolvedAgent === void 0 ? void 0 : resolvedAgent.name) !== null && _z !== void 0 ? _z : packMatch.agent,
                messageType: packToolCalls.length > 0 ? "tool_request" : "response",
                content: assistantContent,
                metadata: packAssistantMetadata,
            });
            if (skillExecution) {
                recordSkillSuccess({
                    start: skillExecution,
                    metadata: {
                        assistantMessageId: packAssistantRow.id,
                        toolCallCount: packToolCalls.length,
                    },
                });
            }
            const packMetadata = {
                agentId: (_0 = resolvedAgent === null || resolvedAgent === void 0 ? void 0 : resolvedAgent.id) !== null && _0 !== void 0 ? _0 : null,
                agentSlug: packAgentSlug,
                skillId: null,
                skillSlug: null,
                runtime: "skill_pack",
                routingReason: "skill_pack_match",
                routingScore: null,
                stopReason: null,
                usage: null,
                model: "ziro-skillpack",
            };
            return {
                conversationId: thread.id,
                userMessage: rowToMessage(userRow),
                assistantMessage: rowToMessage(packAssistantRow),
                toolCalls: packToolCalls,
                metadata: packMetadata,
            };
        }
        const routed = await routeTask(title, input.input);
        const system = buildSystemPrompt([
            resolvedAgent === null || resolvedAgent === void 0 ? void 0 : resolvedAgent.systemPrompt,
            resolvedAgent === null || resolvedAgent === void 0 ? void 0 : resolvedAgent.instructions,
            (_1 = resolvedSkill === null || resolvedSkill === void 0 ? void 0 : resolvedSkill.systemPromptFragment) !== null && _1 !== void 0 ? _1 : resolvedSkill === null || resolvedSkill === void 0 ? void 0 : resolvedSkill.promptFragment,
            routed.composedPrompt,
        ]);
        const priorTurns = buildPriorTurns(history);
        const model = (_2 = input.model) !== null && _2 !== void 0 ? _2 : DEFAULT_MODEL;
        const maxTokens = (_3 = input.maxTokens) !== null && _3 !== void 0 ? _3 : DEFAULT_MAX_TOKENS;
        const completion = await anthropic.messages.create({
            model,
            max_tokens: maxTokens,
            temperature: input.temperature,
            system,
            messages: [...priorTurns, { role: "user", content: input.input }],
        });
        const assistantText = extractText(completion.content);
        const toolCalls = extractToolCalls(completion.content);
        const routeSkillId = "skills" in routed.route && Array.isArray(routed.route.skills)
            ? (_5 = (_4 = routed.route.skills[0]) === null || _4 === void 0 ? void 0 : _4.id) !== null && _5 !== void 0 ? _5 : null
            : null;
        const routeRuntime = "runtime" in routed.route
            ? ((_6 = routed.route.runtime) !== null && _6 !== void 0 ? _6 : null)
            : null;
        const routeReason = "reason" in routed.route
            ? ((_7 = routed.route.reason) !== null && _7 !== void 0 ? _7 : null)
            : null;
        const routeScore = "score" in routed.route && typeof routed.route.score === "number"
            ? routed.route.score
            : null;
        const agentId = (_9 = (_8 = resolvedAgent === null || resolvedAgent === void 0 ? void 0 : resolvedAgent.id) !== null && _8 !== void 0 ? _8 : routed.agentId) !== null && _9 !== void 0 ? _9 : null;
        const agentSlug = (_10 = resolvedAgent === null || resolvedAgent === void 0 ? void 0 : resolvedAgent.slug) !== null && _10 !== void 0 ? _10 : null;
        const skillId = (_11 = resolvedSkill === null || resolvedSkill === void 0 ? void 0 : resolvedSkill.id) !== null && _11 !== void 0 ? _11 : routeSkillId;
        const skillSlug = (_12 = resolvedSkill === null || resolvedSkill === void 0 ? void 0 : resolvedSkill.slug) !== null && _12 !== void 0 ? _12 : null;
        const usage = completion.usage
            ? {
                inputTokens: completion.usage.input_tokens,
                outputTokens: completion.usage.output_tokens,
            }
            : null;
        const assistantMetadata = {
            agent_id: agentId,
            agent_slug: agentSlug,
            skill_id: skillId,
            skill_slug: skillSlug,
            runtime: routeRuntime,
            routing_reason: routeReason,
            routing_score: routeScore,
            routing_task_type: routed.classification.task_type,
            stop_reason: completion.stop_reason,
            model: completion.model,
            usage: (_13 = completion.usage) !== null && _13 !== void 0 ? _13 : null,
            tool_calls: toolCalls,
        };
        const assistantRow = await insertMessage({
            threadId: thread.id,
            senderType: "assistant",
            senderName: (_14 = resolvedAgent === null || resolvedAgent === void 0 ? void 0 : resolvedAgent.name) !== null && _14 !== void 0 ? _14 : "ziro",
            messageType: toolCalls.length > 0 ? "tool_request" : "response",
            content: assistantText,
            metadata: assistantMetadata,
        });
        const metadata = {
            agentId,
            agentSlug,
            skillId,
            skillSlug,
            runtime: routeRuntime,
            routingReason: routeReason,
            routingScore: routeScore,
            stopReason: (_15 = completion.stop_reason) !== null && _15 !== void 0 ? _15 : null,
            usage,
            model: completion.model,
        };
        if (skillExecution) {
            recordSkillSuccess({
                start: skillExecution,
                metadata: {
                    assistantMessageId: assistantRow.id,
                    toolCallCount: toolCalls.length,
                    model: completion.model,
                    stopReason: (_16 = completion.stop_reason) !== null && _16 !== void 0 ? _16 : null,
                    inputTokens: (_17 = usage === null || usage === void 0 ? void 0 : usage.inputTokens) !== null && _17 !== void 0 ? _17 : null,
                    outputTokens: (_18 = usage === null || usage === void 0 ? void 0 : usage.outputTokens) !== null && _18 !== void 0 ? _18 : null,
                },
            });
        }
        return {
            conversationId: thread.id,
            userMessage: rowToMessage(userRow),
            assistantMessage: rowToMessage(assistantRow),
            toolCalls,
            metadata,
        };
    }
    catch (error) {
        if (skillExecution) {
            recordSkillFailure({ start: skillExecution, error });
        }
        throw error;
    }
}
