"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  getPageBinding,
  type PageBinding,
  type QuickAction,
} from "@/lib/agentOS/pageIntelligence";
import { resolveCrossAppAction } from "@/lib/agentOS/crossAppActions";
import {
  appendAgentOSEvent,
  loadAgentOSEventLog,
  saveAgentOSEventLog,
  type AgentOSEventLevel,
  type AgentOSEventRecord,
} from "@/lib/agentOS/eventLog";
import {
  loadRecentSkillInvocations,
  mergeContextualRecommendedSkills,
  pushRecentSkillInvocation,
  saveRecentSkillInvocations,
  type ContextualRecommendedSkill,
  type RecentSkillInvocation,
} from "@/lib/agentOS/recentSkillContext";
import { getAgentMetadata, type AgentMetadata } from "@/lib/agents/agentMetadata";
import { getAgent, type AgentRegistryEntry } from "@/lib/agents/registry";

export type AgentState = "idle" | "listening" | "thinking" | "speaking" | "alert";

export type PointerTarget = {
  selector?: string;
  rect?: { x: number; y: number; w: number; h: number };
  label: string;
  agentId?: string;
};

export type AgentCorner = "br" | "bl" | "tr" | "tl";

export type AgentOSContextValue = {
  pathname: string;
  binding: PageBinding;
  /** Page binding skills plus recency boost from recent skill runs. */
  contextualRecommendedSkills: ContextualRecommendedSkill[];
  recordSkillInvocation: (entry: Omit<RecentSkillInvocation, "at">) => void;
  agentId: string;
  setAgentId: (id: string) => void;
  meta: AgentMetadata;
  registry: AgentRegistryEntry | null;

  state: AgentState;
  setState: (s: AgentState) => void;
  signalAlert: (reason?: string) => void;
  lastAlertReason: string | null;

  bubbleOpen: boolean;
  openBubble: () => void;
  closeBubble: () => void;
  toggleBubble: () => void;

  fullChatOpen: boolean;
  openFullChat: () => void;
  closeFullChat: () => void;

  pointer: PointerTarget | null;
  showPointer: (t: PointerTarget) => void;
  hidePointer: () => void;

  corner: AgentCorner;
  setCorner: (c: AgentCorner) => void;

  runQuickAction: (action: QuickAction) => void;
  eventLog: AgentOSEventRecord[];
  recordEvent: (entry: {
    actionId: string;
    label: string;
    level?: AgentOSEventLevel;
    detail?: string;
  }) => void;
  clearEventLog: () => void;
  eventLogOpen: boolean;
  openEventLog: () => void;
  closeEventLog: () => void;
};

const AgentOSContext = React.createContext<AgentOSContextValue | null>(null);

const STORAGE_KEY_CORNER = "ziro:agentOS:corner";
const STORAGE_KEY_AGENT_OVERRIDE = "ziro:agentOS:agentOverride";

function isBrowser() {
  return typeof window !== "undefined";
}

function readCorner(): AgentCorner {
  if (!isBrowser()) return "br";
  try {
    const v = window.localStorage.getItem(STORAGE_KEY_CORNER);
    if (v === "br" || v === "bl" || v === "tr" || v === "tl") return v;
  } catch {
    /* ignore */
  }
  return "br";
}

function writeCorner(c: AgentCorner) {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(STORAGE_KEY_CORNER, c);
  } catch {
    /* ignore */
  }
}

function safeMeta(id: string): AgentMetadata {
  return (
    getAgentMetadata(id) ?? {
      id,
      displayName: id,
      name: id,
      imagePath: `/static/agents/${id}.png`,
      avatar: `${id}.png`,
      accent: "var(--z-accent)",
      glow: "color-mix(in oklab, var(--z-accent), transparent 55%)",
      tagline: "Agent",
    }
  );
}

export function AgentOSProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname() ?? "/";
  const binding = React.useMemo(() => getPageBinding(pathname), [pathname]);

  const [recentSkillInvocations, setRecentSkillInvocations] = React.useState<RecentSkillInvocation[]>(
    () => loadRecentSkillInvocations(),
  );

  const recordSkillInvocation = React.useCallback((entry: Omit<RecentSkillInvocation, "at">) => {
    setRecentSkillInvocations((prev) => {
      const next = pushRecentSkillInvocation(prev, entry);
      saveRecentSkillInvocations(next);
      return next;
    });
  }, []);

  const contextualRecommendedSkills = React.useMemo(
    () => mergeContextualRecommendedSkills(binding.recommendedSkills, recentSkillInvocations),
    [binding.recommendedSkills, recentSkillInvocations],
  );

  // Agent id: user can override via context (e.g., clicking a secondary orb), else
  // follow the page binding.
  const [override, setOverride] = React.useState<string | null>(null);

  React.useEffect(() => {
    // Reset override on navigation so each page resolves via binding unless
    // the user explicitly picks another agent on this page.
    setOverride(null);
  }, [pathname]);

  const agentId = override ?? binding.primaryAgentId;
  const meta = React.useMemo(() => safeMeta(agentId), [agentId]);
  const registry = React.useMemo(() => getAgent(agentId), [agentId]);

  const [state, setState] = React.useState<AgentState>("idle");
  const [lastAlertReason, setLastAlertReason] = React.useState<string | null>(null);
  const [bubbleOpen, setBubbleOpen] = React.useState(false);
  const [fullChatOpen, setFullChatOpen] = React.useState(false);
  const [pointer, setPointer] = React.useState<PointerTarget | null>(null);
  const [corner, setCornerState] = React.useState<AgentCorner>("br");
  const [eventLog, setEventLog] = React.useState<AgentOSEventRecord[]>(() => loadAgentOSEventLog());
  const [eventLogOpen, setEventLogOpen] = React.useState(false);

  React.useEffect(() => {
    setCornerState(readCorner());
    try {
      const v = window.localStorage.getItem(STORAGE_KEY_AGENT_OVERRIDE);
      if (v) setOverride(v);
    } catch {
      /* ignore */
    }
  }, []);

  const setAgentId = React.useCallback((id: string) => {
    setOverride(id);
    try {
      window.localStorage.setItem(STORAGE_KEY_AGENT_OVERRIDE, id);
    } catch {
      /* ignore */
    }
  }, []);

  const setCorner = React.useCallback((c: AgentCorner) => {
    setCornerState(c);
    writeCorner(c);
  }, []);

  const recordEvent = React.useCallback(
    (entry: {
      actionId: string;
      label: string;
      level?: AgentOSEventLevel;
      detail?: string;
    }) => {
      setEventLog((prev) => {
        const next = appendAgentOSEvent(prev, {
          agentId,
          actionId: entry.actionId,
          label: entry.label,
          level: entry.level ?? "info",
          detail: entry.detail,
          pathname,
        });
        saveAgentOSEventLog(next);
        return next;
      });
    },
    [agentId, pathname],
  );

  const clearEventLog = React.useCallback(() => {
    setEventLog([]);
    saveAgentOSEventLog([]);
  }, []);

  // Auto-decay alert/speaking/thinking back to idle after a short window.
  React.useEffect(() => {
    if (state === "idle" || state === "listening") return;
    const ms = state === "alert" ? 2400 : state === "speaking" ? 1600 : 4000;
    const t = window.setTimeout(() => setState("idle"), ms);
    return () => window.clearTimeout(t);
  }, [state]);

  const signalAlert = React.useCallback((reason?: string) => {
    setLastAlertReason(reason ?? null);
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

  const showPointer = React.useCallback((t: PointerTarget) => {
    setPointer(t);
    setBubbleOpen(false);
  }, []);
  const hidePointer = React.useCallback(() => setPointer(null), []);

  const runQuickAction = React.useCallback(
    (action: QuickAction) => {
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
              label: action.pointerText ?? action.label,
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
          const sk =
            payload && typeof (payload as { skill?: unknown }).skill === "string"
              ? (payload as { skill: string }).skill
              : null;
          if (sk) {
            recordSkillInvocation({
              agent: agentId,
              skillId: sk,
              title: action.label,
            });
          }
          if (isBrowser()) {
            window.dispatchEvent(
              new CustomEvent("ziro:agent-action", {
                detail: { agentId, action, source: "agent-os" },
              }),
            );
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
          } else {
            recordEvent({
              actionId: action.id,
              label: action.label,
              detail: "Ran custom action",
            });
          }
          break;
        }
      }
    },
    [agentId, recordEvent, recordSkillInvocation, router, showPointer],
  );

  // Close everything on ESC (pointer mode, bubble, full chat).
  React.useEffect(() => {
    if (!isBrowser()) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
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

  const value = React.useMemo<AgentOSContextValue>(
    () => ({
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
    }),
    [
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
    ],
  );

  return <AgentOSContext.Provider value={value}>{children}</AgentOSContext.Provider>;
}

export function useAgentOS(): AgentOSContextValue {
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
export function useOptionalAgentOS(): AgentOSContextValue | null {
  return React.useContext(AgentOSContext);
}
