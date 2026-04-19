"use client";

import * as React from "react";
import { X, ChevronUp, ChevronDown, Send } from "lucide-react";
import { cn, focusRingClassName } from "@/components/ui/utils";
import { useAgentOS, type AgentCorner } from "./AgentOSContext";
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

function desktopAnchor(corner: AgentCorner): React.CSSProperties {
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
  const {
    meta,
    registry,
    binding,
    contextualRecommendedSkills,
    recordSkillInvocation,
    bubbleOpen,
    closeBubble,
    corner,
    runQuickAction,
    openFullChat,
    agentId,
    setAgentId,
    setState,
    state,
  } = useAgentOS();
  const isMobile = useIsMobile();
  const [chatExpanded, setChatExpanded] = React.useState(false);
  const [draft, setDraft] = React.useState("");
  const inputRef = React.useRef<HTMLTextAreaElement | null>(null);

  const role = registry?.role ?? getAgent(agentId)?.role ?? "Agent";

  React.useEffect(() => {
    if (!bubbleOpen) {
      setChatExpanded(false);
      setDraft("");
    }
  }, [bubbleOpen]);

  React.useEffect(() => {
    if (bubbleOpen && chatExpanded) {
      const t = window.setTimeout(() => inputRef.current?.focus(), 80);
      return () => window.clearTimeout(t);
    }
  }, [bubbleOpen, chatExpanded]);

  const submit = React.useCallback(() => {
    const text = draft.trim();
    if (!text) return;
    // Minimal local transition — open the full chat and carry the text over via a
    // CustomEvent that the full-chat surface picks up on mount.
    setState("thinking");
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("ziro:agent-chat-seed", { detail: { agentId, text } }),
      );
    }
    setDraft("");
    openFullChat();
  }, [draft, agentId, openFullChat, setState]);

  if (!bubbleOpen) return null;

  const style: React.CSSProperties = isMobile
    ? {
        position: "fixed",
        left: 10,
        right: 10,
        bottom: 10,
        width: "auto",
        zIndex: 65,
      }
    : {
        position: "fixed",
        width: BUBBLE_WIDTH,
        maxWidth: "calc(100vw - 32px)",
        zIndex: 65,
        ...desktopAnchor(corner),
      };

  const agentStyle = {
    "--z-agent-accent": meta.accent,
    "--z-agent-glow": meta.glow,
  } as React.CSSProperties;

  return (
    <>
      {/* Mobile backdrop for focus */}
      {isMobile ? (
        <button
          type="button"
          aria-label="Close assistant"
          onClick={closeBubble}
          className="fixed inset-0 z-[62] bg-black/40 backdrop-blur-[2px]"
        />
      ) : null}

      <section
        role="dialog"
        aria-modal={isMobile ? "true" : "false"}
        aria-label={`${meta.displayName} assistant`}
        className={cn(
          "z-agent-bubble--in overflow-hidden rounded-[var(--z-radius-lg)] border border-[var(--z-border)] bg-[var(--z-surface)]/95 backdrop-blur-md shadow-[0_16px_48px_rgba(0,0,0,0.55)]",
        )}
        style={{ ...style, ...agentStyle }}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full opacity-50 blur-2xl"
          style={{ background: "var(--z-agent-glow)" }}
        />

        {/* A. Header */}
        <header className="flex items-center gap-3 px-4 pt-4">
          <div
            className="h-12 w-12 shrink-0 overflow-hidden rounded-full border"
            style={{ borderColor: "color-mix(in oklab, var(--z-agent-accent), transparent 35%)" }}
          >
            <AgentAvatarImage
              src={meta.imagePath}
              name={meta.displayName}
              accent={meta.accent}
              className="h-full w-full"
            />
          </div>
          <div className="min-w-0 flex-1">
            <div
              className="truncate text-[10px] font-extrabold uppercase tracking-[0.16em]"
              style={{ color: "var(--z-agent-accent)" }}
            >
              {role}
            </div>
            <h4 className="truncate text-base font-bold tracking-tight text-[var(--z-fg)]">
              {meta.displayName}
            </h4>
          </div>
          <button
            type="button"
            aria-label="Close"
            onClick={closeBubble}
            className={cn(
              "grid h-8 w-8 place-items-center rounded-full text-[var(--z-muted)] transition-colors hover:bg-white/5 hover:text-[var(--z-fg)]",
              focusRingClassName(),
            )}
          >
            <X size={16} aria-hidden="true" />
          </button>
        </header>

        {/* B. Guidance line */}
        <p className="relative px-4 pt-3 text-sm leading-relaxed text-[color-mix(in_oklab,var(--z-fg),transparent_18%)]">
          {binding.guidance}
        </p>

        {/* C. Quick actions */}
        {binding.quickActions.length > 0 ? (
          <div className="flex flex-wrap gap-2 px-4 pt-3">
            {binding.quickActions.map((action) => {
              const derivedTitle =
                action.tooltip ??
                (action.intent === "nav" && action.href
                  ? `Open ${action.href}`
                  : action.intent === "custom" &&
                      action.payload &&
                      typeof (action.payload as { skill?: unknown }).skill === "string"
                    ? `Run skill “${(action.payload as { skill: string }).skill}” with ${meta.displayName}`
                    : action.pointerText ?? action.label);
              const isSkillQuickAction =
                action.intent === "custom" &&
                action.payload &&
                typeof (action.payload as { skill?: unknown }).skill === "string";

              const button = (
                <button
                  type="button"
                  title={
                    isSkillQuickAction
                      ? isMobile
                        ? CONTEXTUAL_SKILL_REASON_PAGE
                        : undefined
                      : derivedTitle
                  }
                  aria-label={derivedTitle}
                  onClick={() => runQuickAction(action)}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-[var(--z-radius-md)] border bg-[var(--z-surface-2)] px-2.5 py-1.5 text-xs font-semibold text-[var(--z-fg)] transition-colors",
                    "hover:bg-[color-mix(in_oklab,var(--z-agent-accent),transparent_90%)]",
                    focusRingClassName(),
                  )}
                  style={{
                    borderColor: "color-mix(in oklab, var(--z-agent-accent), transparent 55%)",
                    color: "var(--z-fg)",
                  }}
                >
                  <AgentQuickActionIcon name={action.icon} />
                  <span>{action.label}</span>
                </button>
              );

              return (
                <span key={action.id} className="inline-flex max-w-full">
                  {isSkillQuickAction ? (
                    <AgentBubbleChipTooltip explanation={CONTEXTUAL_SKILL_REASON_PAGE}>
                      {button}
                    </AgentBubbleChipTooltip>
                  ) : (
                    button
                  )}
                </span>
              );
            })}
          </div>
        ) : null}

        {contextualRecommendedSkills.length > 0 ? (
          <div className="px-4 pt-3">
            <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--z-muted)]">
              Suggested skills
            </div>
            <div className="flex flex-wrap gap-1.5">
              {contextualRecommendedSkills.map((s) => {
                const chipLabel = `Switch to ${s.agent} · ${s.title}`;
                const chip = (
                  <button
                    type="button"
                    title={isMobile ? `${s.reason} — ${chipLabel}` : undefined}
                    aria-label={`${chipLabel}. ${s.reason}`}
                    onClick={() => {
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
                    }}
                    className={cn(
                      "rounded-[var(--z-radius-md)] border border-[var(--z-border)] bg-[var(--z-surface-2)] px-2 py-1 text-[11px] font-medium text-[var(--z-fg)] transition-colors",
                      "hover:border-[color-mix(in_oklab,var(--z-agent-accent),transparent_35%)] hover:bg-[color-mix(in_oklab,var(--z-agent-accent),transparent_92%)]",
                      focusRingClassName(),
                    )}
                  >
                    {s.title}
                  </button>
                );

                return (
                  <AgentBubbleChipTooltip key={`${s.agent}:${s.skillId}`} explanation={s.reason}>
                    {chip}
                  </AgentBubbleChipTooltip>
                );
              })}
            </div>
          </div>
        ) : null}

        {/* D. Chat input (collapsible) */}
        <div className="px-4 pt-3">
          <button
            type="button"
            onClick={() => setChatExpanded((v) => !v)}
            className={cn(
              "inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--z-muted)] transition-colors hover:text-[var(--z-fg)]",
              focusRingClassName(),
            )}
            aria-expanded={chatExpanded}
            aria-controls="z-agent-bubble-chat"
          >
            {chatExpanded ? <ChevronDown size={12} /> : <ChevronUp size={12} />}
            {chatExpanded ? "Hide input" : "Ask something"}
          </button>

          {chatExpanded ? (
            <div id="z-agent-bubble-chat" className="mt-2">
              <div
                className="flex items-end gap-2 rounded-[var(--z-radius-md)] border bg-[var(--z-surface-2)] px-2 py-1.5 focus-within:border-[color-mix(in_oklab,var(--z-agent-accent),transparent_40%)]"
                style={{ borderColor: "var(--z-border)" }}
              >
                <textarea
                  ref={inputRef}
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      submit();
                    }
                  }}
                  rows={2}
                  placeholder={`Ask ${meta.displayName}…`}
                  className="min-h-[40px] w-full resize-none bg-transparent text-sm text-[var(--z-fg)] placeholder:text-[var(--z-muted)] focus:outline-none"
                />
                <button
                  type="button"
                  onClick={submit}
                  disabled={!draft.trim() || state === "thinking"}
                  aria-label="Send"
                  className={cn(
                    "grid h-8 w-8 shrink-0 place-items-center rounded-[var(--z-radius-md)] text-black transition-opacity disabled:cursor-not-allowed disabled:opacity-50",
                    focusRingClassName(),
                  )}
                  style={{ background: "var(--z-agent-accent)" }}
                >
                  <Send size={14} aria-hidden="true" />
                </button>
              </div>
            </div>
          ) : null}
        </div>

        {/* E. Footer */}
        <footer className="mt-4 flex items-center justify-between border-t border-[var(--z-border)] bg-[var(--z-surface-2)] px-4 py-2.5">
          <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--z-muted)]">
            ZiroWork · AgentOS
          </span>
          <button
            type="button"
            onClick={openFullChat}
            className={cn(
              "text-[11px] font-extrabold uppercase tracking-[0.12em] transition-colors hover:text-[var(--z-fg)]",
              focusRingClassName(),
            )}
            style={{ color: "var(--z-agent-accent)" }}
          >
            Open Full Chat →
          </button>
        </footer>
      </section>
    </>
  );
}
