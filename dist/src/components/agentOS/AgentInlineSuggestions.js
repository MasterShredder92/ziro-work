"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import * as React from "react";
import { cn, focusRingClassName } from "@/components/ui/utils";
import { useAgentOS } from "./AgentOSContext";
export function AgentInlineSuggestions() {
    const { binding, contextualRecommendedSkills, bubbleOpen, fullChatOpen, eventLogOpen, runQuickAction, recordSkillInvocation, } = useAgentOS();
    const actions = React.useMemo(() => binding.quickActions.slice(0, 3), [binding.quickActions]);
    const skills = React.useMemo(() => contextualRecommendedSkills.slice(0, 2), [contextualRecommendedSkills]);
    const [mounted, setMounted] = React.useState(false);
    const [open, setOpen] = React.useState(false);
    React.useEffect(() => {
        setMounted(true);
    }, []);
    if (!mounted ||
        (actions.length === 0 && skills.length === 0) ||
        bubbleOpen ||
        fullChatOpen ||
        eventLogOpen) {
        return null;
    }
    return (_jsx("aside", { "aria-label": "Agent suggestions", className: "fixed bottom-4 right-4 z-[58] max-w-[80vw]", children: _jsxs("div", { className: "flex flex-col items-end gap-2", children: [open ? (_jsxs("div", { className: "w-[min(520px,calc(100vw-96px))] rounded-[var(--z-radius-lg)] border border-[var(--z-border)] bg-[var(--z-surface)]/95 p-2.5 shadow-[0_14px_36px_rgba(0,0,0,0.45)] backdrop-blur-md", children: [_jsxs("div", { className: "mb-2 flex items-center justify-between gap-3", children: [_jsx("div", { className: "text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--z-muted)]", children: "Agent suggestions" }), _jsx("button", { type: "button", onClick: () => setOpen(false), className: cn("rounded-[var(--z-radius-md)] border border-[var(--z-border)] bg-[var(--z-surface-2)] px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--z-muted)] hover:text-[var(--z-fg)]", focusRingClassName()), children: "Hide" })] }), _jsxs("div", { className: "flex flex-wrap gap-2", children: [actions.map((action) => (_jsx("button", { type: "button", onClick: () => runQuickAction(action), className: cn("rounded-[var(--z-radius-md)] border border-[var(--z-border)] bg-[var(--z-surface-2)] px-2.5 py-1.5 text-xs font-semibold text-[var(--z-fg)] transition-colors hover:bg-white/5", focusRingClassName()), children: action.label }, action.id))), skills.map((skill) => (_jsx("button", { type: "button", onClick: () => {
                                        recordSkillInvocation({
                                            agent: skill.agent,
                                            skillId: skill.skillId,
                                            title: skill.title,
                                        });
                                        runQuickAction({
                                            id: `inline-skill-${skill.skillId}`,
                                            label: skill.title,
                                            intent: "custom",
                                            payload: { skill: skill.skillId },
                                        });
                                    }, className: cn("rounded-[var(--z-radius-md)] border border-[var(--z-border)] bg-[color-mix(in_oklab,var(--z-accent),transparent_92%)] px-2.5 py-1.5 text-xs font-semibold text-[var(--z-fg)] transition-colors hover:bg-[color-mix(in_oklab,var(--z-accent),transparent_86%)]", focusRingClassName()), children: skill.title }, `${skill.agent}:${skill.skillId}`)))] })] })) : null, _jsxs("button", { type: "button", onClick: () => setOpen((value) => !value), className: cn("rounded-full border border-[var(--z-border)] bg-[var(--z-surface)]/95 px-3 py-1.5 text-xs font-semibold text-[var(--z-fg)] shadow-[0_8px_24px_rgba(0,0,0,0.35)] backdrop-blur-md hover:bg-[var(--z-surface-2)]", focusRingClassName()), "aria-expanded": open, "aria-label": "Toggle agent suggestions", children: ["Suggestions (", actions.length + skills.length, ")"] })] }) }));
}
