"use client";
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import * as React from "react";
import { X, ChevronUp, ChevronDown, Send } from "lucide-react";
import { cn, focusRingClassName } from "@/components/ui/utils";
import { useAgentOS } from "./AgentOSContext";
import { AgentAvatarImage } from "./AgentAvatarImage";
import { AgentQuickActionIcon } from "./AgentQuickActionIcon";
import { useIsMobile } from "./useMediaQuery";
import { getAgent } from "@/lib/agents/registry";
import { AgentBubbleChipTooltip } from "./AgentBubbleChipTooltip";
import { CONTEXTUAL_SKILL_REASON_PAGE } from "@/lib/agentOS/recentSkillContext";
const BUBBLE_WIDTH = 320;
const CORNER_MARGIN = 18;
const AVATAR_SIZE_DESKTOP = 56;
const GAP = 12;
function desktopAnchor(corner) {
    const offset = CORNER_MARGIN + AVATAR_SIZE_DESKTOP + GAP;
    switch (corner) {
        case "tl":
            return { top: offset, left: CORNER_MARGIN };
        case "tr":
            return { top: offset, right: CORNER_MARGIN };
        case "bl":
            return { bottom: offset, left: CORNER_MARGIN };
        case "br":
        default:
            return { bottom: offset, right: CORNER_MARGIN };
    }
}
export function AgentBubble() {
    var _a, _b, _c;
    const { meta, registry, binding, contextualRecommendedSkills, recordSkillInvocation, bubbleOpen, closeBubble, corner, runQuickAction, openFullChat, agentId, setAgentId, setState, state, } = useAgentOS();
    const isMobile = useIsMobile();
    const [chatExpanded, setChatExpanded] = React.useState(false);
    const [draft, setDraft] = React.useState("");
    const inputRef = React.useRef(null);
    const role = (_c = (_a = registry === null || registry === void 0 ? void 0 : registry.role) !== null && _a !== void 0 ? _a : (_b = getAgent(agentId)) === null || _b === void 0 ? void 0 : _b.role) !== null && _c !== void 0 ? _c : "Agent";
    React.useEffect(() => {
        if (!bubbleOpen) {
            setChatExpanded(false);
            setDraft("");
        }
    }, [bubbleOpen]);
    React.useEffect(() => {
        if (bubbleOpen && chatExpanded) {
            const t = window.setTimeout(() => { var _a; return (_a = inputRef.current) === null || _a === void 0 ? void 0 : _a.focus(); }, 80);
            return () => window.clearTimeout(t);
        }
    }, [bubbleOpen, chatExpanded]);
    const submit = React.useCallback(() => {
        const text = draft.trim();
        if (!text)
            return;
        // Minimal local transition — open the full chat and carry the text over via a
        // CustomEvent that the full-chat surface picks up on mount.
        setState("thinking");
        if (typeof window !== "undefined") {
            window.dispatchEvent(new CustomEvent("ziro:agent-chat-seed", { detail: { agentId, text } }));
        }
        setDraft("");
        openFullChat();
    }, [draft, agentId, openFullChat, setState]);
    if (!bubbleOpen)
        return null;
    const style = isMobile
        ? {
            position: "fixed",
            left: 10,
            right: 10,
            bottom: 10,
            width: "auto",
            zIndex: 65,
        }
        : Object.assign({ position: "fixed", width: BUBBLE_WIDTH, maxWidth: "calc(100vw - 32px)", zIndex: 65 }, desktopAnchor(corner));
    const agentStyle = {
        "--z-agent-accent": meta.accent,
        "--z-agent-glow": meta.glow,
    };
    return (_jsxs(_Fragment, { children: [isMobile ? (_jsx("button", { type: "button", "aria-label": "Close assistant", onClick: closeBubble, className: "fixed inset-0 z-[62] bg-black/40 backdrop-blur-[2px]" })) : null, _jsxs("section", { role: "dialog", "aria-modal": isMobile ? "true" : "false", "aria-label": `${meta.displayName} assistant`, className: cn("z-agent-bubble--in overflow-hidden rounded-[var(--z-radius-lg)] border border-[var(--z-border)] bg-[var(--z-surface)]/95 backdrop-blur-md shadow-[0_16px_48px_rgba(0,0,0,0.55)]"), style: Object.assign(Object.assign({}, style), agentStyle), children: [_jsx("div", { "aria-hidden": true, className: "pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full opacity-50 blur-2xl", style: { background: "var(--z-agent-glow)" } }), _jsxs("header", { className: "flex items-center gap-3 px-4 pt-4", children: [_jsx("div", { className: "h-12 w-12 shrink-0 overflow-hidden rounded-full border", style: { borderColor: "color-mix(in oklab, var(--z-agent-accent), transparent 35%)" }, children: _jsx(AgentAvatarImage, { src: meta.imagePath, name: meta.displayName, accent: meta.accent, className: "h-full w-full" }) }), _jsxs("div", { className: "min-w-0 flex-1", children: [_jsx("div", { className: "truncate text-[10px] font-extrabold uppercase tracking-[0.16em]", style: { color: "var(--z-agent-accent)" }, children: role }), _jsx("h4", { className: "truncate text-base font-bold tracking-tight text-[var(--z-fg)]", children: meta.displayName })] }), _jsx("button", { type: "button", "aria-label": "Close", onClick: closeBubble, className: cn("grid h-8 w-8 place-items-center rounded-full text-[var(--z-muted)] transition-colors hover:bg-white/5 hover:text-[var(--z-fg)]", focusRingClassName()), children: _jsx(X, { size: 16, "aria-hidden": "true" }) })] }), _jsx("p", { className: "relative px-4 pt-3 text-sm leading-relaxed text-[color-mix(in_oklab,var(--z-fg),transparent_18%)]", children: binding.guidance }), binding.quickActions.length > 0 ? (_jsx("div", { className: "flex flex-wrap gap-2 px-4 pt-3", children: binding.quickActions.map((action) => {
                            var _a, _b;
                            const derivedTitle = (_a = action.tooltip) !== null && _a !== void 0 ? _a : (action.intent === "nav" && action.href
                                ? `Open ${action.href}`
                                : action.intent === "custom" &&
                                    action.payload &&
                                    typeof action.payload.skill === "string"
                                    ? `Run skill “${action.payload.skill}” with ${meta.displayName}`
                                    : (_b = action.pointerText) !== null && _b !== void 0 ? _b : action.label);
                            const isSkillQuickAction = action.intent === "custom" &&
                                action.payload &&
                                typeof action.payload.skill === "string";
                            const button = (_jsxs("button", { type: "button", title: isSkillQuickAction
                                    ? isMobile
                                        ? CONTEXTUAL_SKILL_REASON_PAGE
                                        : undefined
                                    : derivedTitle, "aria-label": derivedTitle, onClick: () => runQuickAction(action), className: cn("inline-flex items-center gap-1.5 rounded-[var(--z-radius-md)] border bg-[var(--z-surface-2)] px-2.5 py-1.5 text-xs font-semibold text-[var(--z-fg)] transition-colors", "hover:bg-[color-mix(in_oklab,var(--z-agent-accent),transparent_90%)]", focusRingClassName()), style: {
                                    borderColor: "color-mix(in oklab, var(--z-agent-accent), transparent 55%)",
                                    color: "var(--z-fg)",
                                }, children: [_jsx(AgentQuickActionIcon, { name: action.icon }), _jsx("span", { children: action.label })] }));
                            return (_jsx("span", { className: "inline-flex max-w-full", children: isSkillQuickAction ? (_jsx(AgentBubbleChipTooltip, { explanation: CONTEXTUAL_SKILL_REASON_PAGE, children: button })) : (button) }, action.id));
                        }) })) : null, contextualRecommendedSkills.length > 0 ? (_jsxs("div", { className: "px-4 pt-3", children: [_jsx("div", { className: "mb-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--z-muted)]", children: "Suggested skills" }), _jsx("div", { className: "flex flex-wrap gap-1.5", children: contextualRecommendedSkills.map((s) => {
                                    const chipLabel = `Switch to ${s.agent} · ${s.title}`;
                                    const chip = (_jsx("button", { type: "button", title: isMobile ? `${s.reason} — ${chipLabel}` : undefined, "aria-label": `${chipLabel}. ${s.reason}`, onClick: () => {
                                            recordSkillInvocation({
                                                agent: s.agent,
                                                skillId: s.skillId,
                                                title: s.title,
                                            });
                                            setAgentId(s.agent);
                                            runQuickAction({
                                                id: s.skillId,
                                                label: s.title,
                                                intent: "custom",
                                                payload: { skill: s.skillId },
                                            });
                                            setState("speaking");
                                        }, className: cn("rounded-[var(--z-radius-md)] border border-[var(--z-border)] bg-[var(--z-surface-2)] px-2 py-1 text-[11px] font-medium text-[var(--z-fg)] transition-colors", "hover:border-[color-mix(in_oklab,var(--z-agent-accent),transparent_35%)] hover:bg-[color-mix(in_oklab,var(--z-agent-accent),transparent_92%)]", focusRingClassName()), children: s.title }));
                                    return (_jsx(AgentBubbleChipTooltip, { explanation: s.reason, children: chip }, `${s.agent}:${s.skillId}`));
                                }) })] })) : null, _jsxs("div", { className: "px-4 pt-3", children: [_jsxs("button", { type: "button", onClick: () => setChatExpanded((v) => !v), className: cn("inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--z-muted)] transition-colors hover:text-[var(--z-fg)]", focusRingClassName()), "aria-expanded": chatExpanded, "aria-controls": "z-agent-bubble-chat", children: [chatExpanded ? _jsx(ChevronDown, { size: 12 }) : _jsx(ChevronUp, { size: 12 }), chatExpanded ? "Hide input" : "Ask something"] }), chatExpanded ? (_jsx("div", { id: "z-agent-bubble-chat", className: "mt-2", children: _jsxs("div", { className: "flex items-end gap-2 rounded-[var(--z-radius-md)] border bg-[var(--z-surface-2)] px-2 py-1.5 focus-within:border-[color-mix(in_oklab,var(--z-agent-accent),transparent_40%)]", style: { borderColor: "var(--z-border)" }, children: [_jsx("textarea", { ref: inputRef, value: draft, onChange: (e) => setDraft(e.target.value), onKeyDown: (e) => {
                                                if (e.key === "Enter" && !e.shiftKey) {
                                                    e.preventDefault();
                                                    submit();
                                                }
                                            }, rows: 2, placeholder: `Ask ${meta.displayName}…`, className: "min-h-[40px] w-full resize-none bg-transparent text-sm text-[var(--z-fg)] placeholder:text-[var(--z-muted)] focus:outline-none" }), _jsx("button", { type: "button", onClick: submit, disabled: !draft.trim() || state === "thinking", "aria-label": "Send", className: cn("grid h-8 w-8 shrink-0 place-items-center rounded-[var(--z-radius-md)] text-black transition-opacity disabled:cursor-not-allowed disabled:opacity-50", focusRingClassName()), style: { background: "var(--z-agent-accent)" }, children: _jsx(Send, { size: 14, "aria-hidden": "true" }) })] }) })) : null] }), _jsxs("footer", { className: "mt-4 flex items-center justify-between border-t border-[var(--z-border)] bg-[var(--z-surface-2)] px-4 py-2.5", children: [_jsx("span", { className: "text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--z-muted)]", children: "ZiroWork \u00B7 AgentOS" }), _jsx("button", { type: "button", onClick: openFullChat, className: cn("text-[11px] font-extrabold uppercase tracking-[0.12em] transition-colors hover:text-[var(--z-fg)]", focusRingClassName()), style: { color: "var(--z-agent-accent)" }, children: "Open Full Chat \u2192" })] })] })] }));
}
