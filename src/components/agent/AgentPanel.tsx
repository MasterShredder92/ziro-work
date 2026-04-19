"use client";

import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";
import { cn } from "@/components/ui/utils";
import {
  getPageRecommendedSkills,
  pageTypeFromPath,
  type RecommendedSkill,
} from "@/lib/ziro/pageIntelligence";
import { InlineNotice } from "@/components/system/SurfaceStates";

export type AgentPanelStatus = "active" | "idle" | "blocked";

export type AgentPanelSkillTrigger = (skill: RecommendedSkill) => void | Promise<void>;

export type AgentPanelProps = {
  agentName: string;
  avatarUrl?: string | null;
  status: AgentPanelStatus;
  summary: string;
  nextActions: string[];
  /** When viewing a student, surface pipeline position */
  currentStageName?: string | null;
  blockers?: string[];
  className?: string;
  /** Optional explicit page type override (else inferred from route). */
  pageType?: string;
  /** Optional explicit override for recommended skills. */
  recommendedSkills?: RecommendedSkill[];
  /** Callback fired when a recommended skill button is clicked. */
  onSkillSelected?: AgentPanelSkillTrigger;
  /** Extra payload to merge into the conversation pipeline request. */
  skillContext?: {
    tenantId?: string;
    profileId?: string;
    conversationId?: string;
    teacherId?: string;
    studentId?: string;
    familyId?: string;
  };
};

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const a = parts[0]?.[0] ?? "?";
  const b = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? "") : "";
  return (a + b).toUpperCase();
}

export function AgentPanel({
  agentName,
  avatarUrl,
  status,
  summary,
  nextActions,
  currentStageName,
  blockers,
  className,
  pageType,
  recommendedSkills,
  onSkillSelected,
  skillContext,
}: AgentPanelProps) {
  const active = status === "active";
  const blocked = status === "blocked";
  const pathname = usePathname();

  const resolvedPageType = useMemo(() => {
    if (pageType) return pageType;
    return pageTypeFromPath(pathname);
  }, [pageType, pathname]);

  const skills = useMemo<RecommendedSkill[]>(() => {
    if (recommendedSkills && recommendedSkills.length > 0) {
      return recommendedSkills;
    }
    return getPageRecommendedSkills(resolvedPageType);
  }, [recommendedSkills, resolvedPageType]);

  return (
    <section
      className={cn(
        "rounded-[var(--z-radius-lg)] border border-[var(--z-border)] bg-[var(--z-surface)] p-[var(--z-space-4)] sm:p-[var(--z-space-5)]",
        active &&
          "border-[color-mix(in_oklab,var(--z-accent),transparent_55%)] shadow-[0_0_0_1px_color-mix(in_oklab,var(--z-accent),transparent_78%),0_0_28px_color-mix(in_oklab,var(--z-accent),transparent_88%)]",
        blocked && "border-[color-mix(in_oklab,var(--z-danger),transparent_55%)]",
        className,
      )}
    >
      <div className="flex flex-col gap-[var(--z-space-4)] sm:flex-row sm:items-start">
        <div
          className={cn(
            "relative mx-auto h-16 w-16 shrink-0 overflow-hidden rounded-full border border-[var(--z-border)] bg-[var(--z-surface-2)] sm:mx-0",
            active && "border-[color-mix(in_oklab,var(--z-accent),transparent_40%)]",
          )}
        >
          {avatarUrl ? (
            // Avatar URLs are tenant-provided; skip next/image remote configuration.
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-sm font-bold tracking-tight text-[var(--z-accent)]">
              {initials(agentName)}
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1 space-y-[var(--z-space-3)]">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--z-muted)]">Agent</div>
              <div className="text-lg font-semibold tracking-tight text-[var(--z-fg)]">{agentName}</div>
            </div>
            <div
              className={cn(
                "rounded-full border px-2.5 py-0.5 text-xs font-semibold",
                active &&
                  "border-[color-mix(in_oklab,var(--z-accent),transparent_45%)] bg-[color-mix(in_oklab,var(--z-accent),transparent_92%)] text-[var(--z-accent)]",
                status === "idle" && "border-[var(--z-border)] bg-[var(--z-surface-2)] text-[var(--z-muted)]",
                blocked &&
                  "border-[color-mix(in_oklab,var(--z-danger),transparent_45%)] bg-[color-mix(in_oklab,var(--z-danger),transparent_92%)] text-[var(--z-danger)]",
              )}
            >
              {status}
            </div>
          </div>

          <p className="text-sm leading-relaxed text-[color-mix(in_oklab,var(--z-fg),transparent_22%)]">{summary}</p>

          {currentStageName ? (
            <div className="text-xs font-semibold text-[var(--z-muted)]">
              Stage{" "}
              <span className="text-[var(--z-accent)]">{currentStageName}</span>
            </div>
          ) : null}

          {blockers && blockers.length > 0 ? (
            <div className="space-y-1.5">
              <div className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--z-muted)]">Needs attention</div>
              <ul className="space-y-1 text-sm text-[var(--z-fg)]">
                {blockers.map((b, i) => (
                  <li
                    key={`${b}-${i}`}
                    className="rounded-[var(--z-radius-sm)] border border-[var(--z-border)] bg-[var(--z-surface-2)] px-[var(--z-space-3)] py-[var(--z-space-2)] text-xs leading-snug text-[color-mix(in_oklab,var(--z-fg),transparent_12%)]"
                  >
                    {b.replace(/^[a-z0-9_]+:\s*/i, "")}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {nextActions.length > 0 ? (
            <div className="space-y-1.5">
              <div className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--z-muted)]">Next steps</div>
              <ol className="list-decimal space-y-1 pl-5 text-sm text-[color-mix(in_oklab,var(--z-fg),transparent_10%)]">
                {nextActions.map((a, i) => (
                  <li key={`${a}-${i}`}>{a}</li>
                ))}
              </ol>
            </div>
          ) : null}

          {skills.length > 0 ? (
            <AgentSkillButtons
              skills={skills}
              onSkillSelected={onSkillSelected}
              skillContext={skillContext}
            />
          ) : null}
        </div>
      </div>
    </section>
  );
}

function AgentSkillButtons({
  skills,
  onSkillSelected,
  skillContext,
}: {
  skills: RecommendedSkill[];
  onSkillSelected?: AgentPanelSkillTrigger;
  skillContext?: AgentPanelProps["skillContext"];
}) {
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastRun, setLastRun] = useState<string | null>(null);

  const handleClick = async (skill: RecommendedSkill) => {
    setError(null);
    setPending(skill.id);
    try {
      if (onSkillSelected) {
        await onSkillSelected(skill);
      } else {
        await triggerConversationPipeline(skill, skillContext);
      }
      setLastRun(skill.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Skill trigger failed");
    } finally {
      setPending(null);
    }
  };

  return (
    <div className="space-y-1.5">
      <div className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--z-muted)]">
        Recommended skills
      </div>
      {pending ? (
        <div className="text-[11px] text-[var(--z-muted)]" aria-live="polite">
          Running {skills.find((skill) => skill.id === pending)?.title ?? "skill"}...
        </div>
      ) : null}
      <div className="flex flex-wrap gap-2">
        {skills.map((s) => {
          const isPending = pending === s.id;
          const didRun = lastRun === s.id && !isPending;
          return (
            <button
              key={s.id}
              type="button"
              disabled={isPending}
              onClick={() => handleClick(s)}
              title={s.description}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-[var(--z-radius-sm)] border px-2.5 py-1 text-xs font-semibold transition-colors",
                "border-[var(--z-border)] bg-[var(--z-surface-2)] text-[var(--z-fg)] hover:border-[color-mix(in_oklab,var(--z-accent),transparent_45%)] hover:text-[var(--z-accent)]",
                isPending && "opacity-60",
                didRun &&
                  "border-[color-mix(in_oklab,var(--z-accent),transparent_40%)] text-[var(--z-accent)]",
              )}
            >
              <span className="uppercase tracking-[0.08em] text-[10px] text-[var(--z-muted)]">
                {s.agent}
              </span>
              <span>{s.title}</span>
            </button>
          );
        })}
      </div>
      {error ? <InlineNotice tone="danger">{error}</InlineNotice> : null}
    </div>
  );
}

async function triggerConversationPipeline(
  skill: RecommendedSkill,
  ctx: AgentPanelProps["skillContext"] | undefined,
): Promise<void> {
  const body: Record<string, unknown> = {
    agent: skill.agent,
    skill: skill.key,
    input: `Run ${skill.title}`,
  };
  if (ctx?.tenantId) body.tenantId = ctx.tenantId;
  if (ctx?.profileId) body.profileId = ctx.profileId;
  if (ctx?.conversationId) body.conversationId = ctx.conversationId;
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
