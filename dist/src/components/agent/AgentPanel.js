"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";
import { cn } from "@/components/ui/utils";
import { getPageRecommendedSkills, pageTypeFromPath, } from "@/lib/ziro/pageIntelligence";
import { InlineNotice } from "@/components/system/SurfaceStates";
function initials(name) {
    var _a, _b, _c, _d;
    const parts = name.trim().split(/\s+/).filter(Boolean);
    const a = (_b = (_a = parts[0]) === null || _a === void 0 ? void 0 : _a[0]) !== null && _b !== void 0 ? _b : "?";
    const b = parts.length > 1 ? ((_d = (_c = parts[parts.length - 1]) === null || _c === void 0 ? void 0 : _c[0]) !== null && _d !== void 0 ? _d : "") : "";
    return (a + b).toUpperCase();
}
export function AgentPanel({ agentName, avatarUrl, status, summary, nextActions, currentStageName, blockers, className, pageType, recommendedSkills, onSkillSelected, skillContext, }) {
    const active = status === "active";
    const blocked = status === "blocked";
    const pathname = usePathname();
    const resolvedPageType = useMemo(() => {
        if (pageType)
            return pageType;
        return pageTypeFromPath(pathname);
    }, [pageType, pathname]);
    const skills = useMemo(() => {
        if (recommendedSkills && recommendedSkills.length > 0) {
            return recommendedSkills;
        }
        return getPageRecommendedSkills(resolvedPageType);
    }, [recommendedSkills, resolvedPageType]);
    return (_jsx("section", { className: cn("rounded-[var(--z-radius-lg)] border border-[var(--z-border)] bg-[var(--z-surface)] p-[var(--z-space-4)] sm:p-[var(--z-space-5)]", active &&
            "border-[color-mix(in_oklab,var(--z-accent),transparent_55%)] shadow-[0_0_0_1px_color-mix(in_oklab,var(--z-accent),transparent_78%),0_0_28px_color-mix(in_oklab,var(--z-accent),transparent_88%)]", blocked && "border-[color-mix(in_oklab,var(--z-danger),transparent_55%)]", className), children: _jsxs("div", { className: "flex flex-col gap-[var(--z-space-4)] sm:flex-row sm:items-start", children: [_jsx("div", { className: cn("relative mx-auto h-16 w-16 shrink-0 overflow-hidden rounded-full border border-[var(--z-border)] bg-[var(--z-surface-2)] sm:mx-0", active && "border-[color-mix(in_oklab,var(--z-accent),transparent_40%)]"), children: avatarUrl ? (_jsx("img", { src: avatarUrl, alt: "", className: "h-full w-full object-cover" })) : (_jsx("div", { className: "flex h-full w-full items-center justify-center text-sm font-bold tracking-tight text-[var(--z-accent)]", children: initials(agentName) })) }), _jsxs("div", { className: "min-w-0 flex-1 space-y-[var(--z-space-3)]", children: [_jsxs("div", { className: "flex flex-wrap items-center justify-between gap-2", children: [_jsxs("div", { children: [_jsx("div", { className: "text-xs font-semibold uppercase tracking-[0.14em] text-[var(--z-muted)]", children: "Agent" }), _jsx("div", { className: "text-lg font-semibold tracking-tight text-[var(--z-fg)]", children: agentName })] }), _jsx("div", { className: cn("rounded-full border px-2.5 py-0.5 text-xs font-semibold", active &&
                                        "border-[color-mix(in_oklab,var(--z-accent),transparent_45%)] bg-[color-mix(in_oklab,var(--z-accent),transparent_92%)] text-[var(--z-accent)]", status === "idle" && "border-[var(--z-border)] bg-[var(--z-surface-2)] text-[var(--z-muted)]", blocked &&
                                        "border-[color-mix(in_oklab,var(--z-danger),transparent_45%)] bg-[color-mix(in_oklab,var(--z-danger),transparent_92%)] text-[var(--z-danger)]"), children: status })] }), _jsx("p", { className: "text-sm leading-relaxed text-[color-mix(in_oklab,var(--z-fg),transparent_22%)]", children: summary }), currentStageName ? (_jsxs("div", { className: "text-xs font-semibold text-[var(--z-muted)]", children: ["Stage", " ", _jsx("span", { className: "text-[var(--z-accent)]", children: currentStageName })] })) : null, blockers && blockers.length > 0 ? (_jsxs("div", { className: "space-y-1.5", children: [_jsx("div", { className: "text-xs font-semibold uppercase tracking-[0.12em] text-[var(--z-muted)]", children: "Needs attention" }), _jsx("ul", { className: "space-y-1 text-sm text-[var(--z-fg)]", children: blockers.map((b, i) => (_jsx("li", { className: "rounded-[var(--z-radius-sm)] border border-[var(--z-border)] bg-[var(--z-surface-2)] px-[var(--z-space-3)] py-[var(--z-space-2)] text-xs leading-snug text-[color-mix(in_oklab,var(--z-fg),transparent_12%)]", children: b.replace(/^[a-z0-9_]+:\s*/i, "") }, `${b}-${i}`))) })] })) : null, nextActions.length > 0 ? (_jsxs("div", { className: "space-y-1.5", children: [_jsx("div", { className: "text-xs font-semibold uppercase tracking-[0.12em] text-[var(--z-muted)]", children: "Next steps" }), _jsx("ol", { className: "list-decimal space-y-1 pl-5 text-sm text-[color-mix(in_oklab,var(--z-fg),transparent_10%)]", children: nextActions.map((a, i) => (_jsx("li", { children: a }, `${a}-${i}`))) })] })) : null, skills.length > 0 ? (_jsx(AgentSkillButtons, { skills: skills, onSkillSelected: onSkillSelected, skillContext: skillContext })) : null] })] }) }));
}
function AgentSkillButtons({ skills, onSkillSelected, skillContext, }) {
    var _a, _b;
    const [pending, setPending] = useState(null);
    const [error, setError] = useState(null);
    const [lastRun, setLastRun] = useState(null);
    const handleClick = async (skill) => {
        setError(null);
        setPending(skill.id);
        try {
            if (onSkillSelected) {
                await onSkillSelected(skill);
            }
            else {
                await triggerConversationPipeline(skill, skillContext);
            }
            setLastRun(skill.id);
        }
        catch (err) {
            setError(err instanceof Error ? err.message : "Skill trigger failed");
        }
        finally {
            setPending(null);
        }
    };
    return (_jsxs("div", { className: "space-y-1.5", children: [_jsx("div", { className: "text-xs font-semibold uppercase tracking-[0.12em] text-[var(--z-muted)]", children: "Recommended skills" }), pending ? (_jsxs("div", { className: "text-[11px] text-[var(--z-muted)]", "aria-live": "polite", children: ["Running ", (_b = (_a = skills.find((skill) => skill.id === pending)) === null || _a === void 0 ? void 0 : _a.title) !== null && _b !== void 0 ? _b : "skill", "..."] })) : null, _jsx("div", { className: "flex flex-wrap gap-2", children: skills.map((s) => {
                    const isPending = pending === s.id;
                    const didRun = lastRun === s.id && !isPending;
                    return (_jsxs("button", { type: "button", disabled: isPending, onClick: () => handleClick(s), title: s.description, className: cn("inline-flex items-center gap-1.5 rounded-[var(--z-radius-sm)] border px-2.5 py-1 text-xs font-semibold transition-colors", "border-[var(--z-border)] bg-[var(--z-surface-2)] text-[var(--z-fg)] hover:border-[color-mix(in_oklab,var(--z-accent),transparent_45%)] hover:text-[var(--z-accent)]", isPending && "opacity-60", didRun &&
                            "border-[color-mix(in_oklab,var(--z-accent),transparent_40%)] text-[var(--z-accent)]"), children: [_jsx("span", { className: "uppercase tracking-[0.08em] text-[10px] text-[var(--z-muted)]", children: s.agent }), _jsx("span", { children: s.title })] }, s.id));
                }) }), error ? _jsx(InlineNotice, { tone: "danger", children: error }) : null] }));
}
async function triggerConversationPipeline(skill, ctx) {
    const body = {
        agent: skill.agent,
        skill: skill.key,
        input: `Run ${skill.title}`,
    };
    if (ctx === null || ctx === void 0 ? void 0 : ctx.tenantId)
        body.tenantId = ctx.tenantId;
    if (ctx === null || ctx === void 0 ? void 0 : ctx.profileId)
        body.profileId = ctx.profileId;
    if (ctx === null || ctx === void 0 ? void 0 : ctx.conversationId)
        body.conversationId = ctx.conversationId;
    if (typeof window !== "undefined") {
        body.pathname = window.location.pathname;
    }
    const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
    });
    if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(text || `Skill trigger failed (${res.status})`);
    }
}
