"use client";
import { jsx as _jsx } from "react/jsx-runtime";
import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
import { getPageBinding, } from "@/lib/agentOS/pageIntelligence";
import { resolveCrossAppAction } from "@/lib/agentOS/crossAppActions";
import { appendAgentOSEvent, loadAgentOSEventLog, saveAgentOSEventLog, } from "@/lib/agentOS/eventLog";
import { loadRecentSkillInvocations, mergeContextualRecommendedSkills, pushRecentSkillInvocation, saveRecentSkillInvocations, } from "@/lib/agentOS/recentSkillContext";
import { getAgentMetadata } from "@/lib/agents/agentMetadata";
import { getAgent } from "@/lib/agents/registry";
const AgentOSContext = React.createContext(null);
const STORAGE_KEY_CORNER = "ziro:agentOS:corner";
const STORAGE_KEY_AGENT_OVERRIDE = "ziro:agentOS:agentOverride";
function isBrowser() {
    return typeof window !== "undefined";
}
function readCorner() {
    if (!isBrowser())
        return "br";
    try {
        const v = window.localStorage.getItem(STORAGE_KEY_CORNER);
        if (v === "br" || v === "bl" || v === "tr" || v === "tl")
            return v;
    }
    catch (_a) {
        /* ignore */
    }
    return "br";
}
function writeCorner(c) {
    if (!isBrowser())
        return;
    try {
        window.localStorage.setItem(STORAGE_KEY_CORNER, c);
    }
    catch (_a) {
        /* ignore */
    }
}
function safeMeta(id) {
    var _a;
    return ((_a = getAgentMetadata(id)) !== null && _a !== void 0 ? _a : {
        id,
        displayName: id,
        name: id,
        imagePath: `/static/agents/${id}.png`,
        avatar: `${id}.png`,
        accent: "var(--z-accent)",
        glow: "color-mix(in oklab, var(--z-accent), transparent 55%)",
        tagline: "Agent",
        role: "Assistant",
        suggestedPrompts: [],
    });
}
export function AgentOSProvider({ children }) {
    var _a;
    const router = useRouter();
    const pathname = (_a = usePathname()) !== null && _a !== void 0 ? _a : "/";
    const binding = React.useMemo(() => getPageBinding(pathname), [pathname]);
    const [recentSkillInvocations, setRecentSkillInvocations] = React.useState(() => loadRecentSkillInvocations());
    const recordSkillInvocation = React.useCallback((entry) => {
        setRecentSkillInvocations((prev) => {
            const next = pushRecentSkillInvocation(prev, entry);
            saveRecentSkillInvocations(next);
            return next;
        });
    }, []);
    const contextualRecommendedSkills = React.useMemo(() => mergeContextualRecommendedSkills(binding.recommendedSkills, recentSkillInvocations), [binding.recommendedSkills, recentSkillInvocations]);
    // Agent id: user can override via context (e.g., clicking a secondary orb), else
    // follow the page binding.
    const [override, setOverride] = React.useState(null);
    React.useEffect(() => {
        // Reset override on navigation so each page resolves via binding unless
        // the user explicitly picks another agent on this page.
        setOverride(null);
    }, [pathname]);
    const agentId = override !== null && override !== void 0 ? override : binding.primaryAgentId;
    const meta = React.useMemo(() => safeMeta(agentId), [agentId]);
    const registry = React.useMemo(() => getAgent(agentId), [agentId]);
    const [state, setState] = React.useState("idle");
    const [lastAlertReason, setLastAlertReason] = React.useState(null);
    const [bubbleOpen, setBubbleOpen] = React.useState(false);
    const [fullChatOpen, setFullChatOpen] = React.useState(false);
    const [pointer, setPointer] = React.useState(null);
    const [corner, setCornerState] = React.useState("br");
    const [eventLog, setEventLog] = React.useState(() => loadAgentOSEventLog());
    const [eventLogOpen, setEventLogOpen] = React.useState(false);
    React.useEffect(() => {
        setCornerState(readCorner());
        try {
            const v = window.localStorage.getItem(STORAGE_KEY_AGENT_OVERRIDE);
            if (v)
                setOverride(v);
        }
        catch (_a) {
            /* ignore */
        }
    }, []);
    const setAgentId = React.useCallback((id) => {
        setOverride(id);
        try {
            window.localStorage.setItem(STORAGE_KEY_AGENT_OVERRIDE, id);
        }
        catch (_a) {
            /* ignore */
        }
    }, []);
    const setCorner = React.useCallback((c) => {
        setCornerState(c);
        writeCorner(c);
    }, []);
    const recordEvent = React.useCallback((entry) => {
        setEventLog((prev) => {
            var _a;
            const next = appendAgentOSEvent(prev, {
                agentId,
                actionId: entry.actionId,
                label: entry.label,
                level: (_a = entry.level) !== null && _a !== void 0 ? _a : "info",
                detail: entry.detail,
                pathname,
            });
            saveAgentOSEventLog(next);
            return next;
        });
    }, [agentId, pathname]);
    const clearEventLog = React.useCallback(() => {
        setEventLog([]);
        saveAgentOSEventLog([]);
    }, []);
    // Auto-decay alert/speaking/thinking back to idle after a short window.
    React.useEffect(() => {
        if (state === "idle" || state === "listening")
            return;
        const ms = state === "alert" ? 2400 : state === "speaking" ? 1600 : 4000;
        const t = window.setTimeout(() => setState("idle"), ms);
        return () => window.clearTimeout(t);
    }, [state]);
    const signalAlert = React.useCallback((reason) => {
        setLastAlertReason(reason !== null && reason !== void 0 ? reason : null);
        setState("alert");
    }, []);
    const openBubble = React.useCallback(() => {
        setBubbleOpen(true);
        setPointer(null);
    }, []);
    const closeBubble = React.useCallback(() => setBubbleOpen(false), []);
    const toggleBubble = React.useCallback(() => setBubbleOpen((v) => !v), []);
    const openFullChat = React.useCallback(() => {
        setFullChatOpen(true);
        setBubbleOpen(false);
        setPointer(null);
    }, []);
    const closeFullChat = React.useCallback(() => setFullChatOpen(false), []);
    const showPointer = React.useCallback((t) => {
        setPointer(t);
        setBubbleOpen(false);
    }, []);
    const hidePointer = React.useCallback(() => setPointer(null), []);
    const runQuickAction = React.useCallback((action) => {
        var _a;
        switch (action.intent) {
            case "nav": {
                if (action.href) {
                    router.push(action.href);
                    recordEvent({
                        actionId: action.id,
                        label: action.label,
                        level: "success",
                        detail: `Navigated to ${action.href}`,
                    });
                }
                break;
            }
            case "open-chat": {
                setFullChatOpen(true);
                setBubbleOpen(false);
                recordEvent({
                    actionId: action.id,
                    label: action.label,
                    level: "success",
                    detail: "Opened full chat",
                });
                break;
            }
            case "analyze": {
                setState("thinking");
                // Decay back to speaking then idle to feel responsive.
                window.setTimeout(() => setState("speaking"), 900);
                recordEvent({
                    actionId: action.id,
                    label: action.label,
                    detail: "Started analysis",
                });
                break;
            }
            case "summon": {
                setState("speaking");
                setBubbleOpen(true);
                recordEvent({
                    actionId: action.id,
                    label: action.label,
                    detail: "Opened assistant bubble",
                });
                break;
            }
            case "pointer": {
                if (action.target) {
                    showPointer({
                        selector: action.target,
                        label: (_a = action.pointerText) !== null && _a !== void 0 ? _a : action.label,
                        agentId,
                    });
                    recordEvent({
                        actionId: action.id,
                        label: action.label,
                        detail: `Pointing at ${action.target}`,
                    });
                }
                break;
            }
            case "custom":
            default: {
                // Surface as a speaking pulse so it feels reactive. The host page can
                // listen for a CustomEvent to actually perform domain work.
                setState("speaking");
                const payload = action.payload;
                const sk = payload && typeof payload.skill === "string"
                    ? payload.skill
                    : null;
                if (sk) {
                    recordSkillInvocation({
                        agent: agentId,
                        skillId: sk,
                        title: action.label,
                    });
                }
                if (isBrowser()) {
                    window.dispatchEvent(new CustomEvent("ziro:agent-action", {
                        detail: { agentId, action, source: "agent-os" },
                    }));
                }
                const resolved = resolveCrossAppAction(action);
                if (resolved) {
                    router.push(resolved.href);
                    recordEvent({
                        actionId: action.id,
                        label: action.label,
                        level: "success",
                        detail: resolved.detail,
                    });
                }
                else {
                    recordEvent({
                        actionId: action.id,
                        label: action.label,
                        detail: "Ran custom action",
                    });
                }
                break;
            }
        }
    }, [agentId, recordEvent, recordSkillInvocation, router, showPointer]);
    // Close everything on ESC (pointer mode, bubble, full chat).
    React.useEffect(() => {
        if (!isBrowser())
            return;
        const onKey = (e) => {
            if (e.key !== "Escape")
                return;
            if (pointer) {
                setPointer(null);
                return;
            }
            if (fullChatOpen) {
                setFullChatOpen(false);
                return;
            }
            if (eventLogOpen) {
                setEventLogOpen(false);
                return;
            }
            if (bubbleOpen) {
                setBubbleOpen(false);
            }
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [pointer, fullChatOpen, eventLogOpen, bubbleOpen]);
    const value = React.useMemo(() => ({
        pathname,
        binding,
        contextualRecommendedSkills,
        recordSkillInvocation,
        agentId,
        setAgentId,
        meta,
        registry,
        state,
        setState,
        signalAlert,
        lastAlertReason,
        bubbleOpen,
        openBubble,
        closeBubble,
        toggleBubble,
        fullChatOpen,
        openFullChat,
        closeFullChat,
        pointer,
        showPointer,
        hidePointer,
        corner,
        setCorner,
        runQuickAction,
        eventLog,
        recordEvent,
        clearEventLog,
        eventLogOpen,
        openEventLog: () => setEventLogOpen(true),
        closeEventLog: () => setEventLogOpen(false),
    }), [
        pathname,
        binding,
        contextualRecommendedSkills,
        recordSkillInvocation,
        agentId,
        setAgentId,
        meta,
        registry,
        state,
        signalAlert,
        lastAlertReason,
        bubbleOpen,
        openBubble,
        closeBubble,
        toggleBubble,
        fullChatOpen,
        openFullChat,
        closeFullChat,
        pointer,
        showPointer,
        hidePointer,
        corner,
        setCorner,
        runQuickAction,
        eventLog,
        recordEvent,
        clearEventLog,
        eventLogOpen,
    ]);
    return _jsx(AgentOSContext.Provider, { value: value, children: children });
}
export function useAgentOS() {
    const ctx = React.useContext(AgentOSContext);
    if (!ctx) {
        throw new Error("useAgentOS must be used within <AgentOSProvider>.");
    }
    return ctx;
}
/**
 * Optional variant that returns null when no provider is mounted — lets
 * components (e.g. orb pages in the sandbox) opt in without crashing.
 */
export function useOptionalAgentOS() {
    return React.useContext(AgentOSContext);
}
