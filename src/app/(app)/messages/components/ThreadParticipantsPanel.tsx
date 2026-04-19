"use client";

import { ChevronDown, Mail, MessageSquare, Smartphone } from "lucide-react";
import { useMemo, useState } from "react";
import type { ChannelType, MessageParticipant } from "@/lib/messaging/types";
import {
  collapsedNamePreview,
  deriveThreadParticipants,
  type ThreadParticipantChannel,
} from "./deriveThreadParticipants";

export type ThreadParticipantsPanelProps = {
  participants: MessageParticipant[];
  threadChannelType: ChannelType;
  contextType: string | null;
  threadSubject: string | null;
};

function ChannelGlyph({ channel }: { channel: ThreadParticipantChannel }) {
  const cls = "size-3.5 shrink-0 text-[var(--z-muted)]";
  if (channel === "email") return <Mail className={cls} aria-hidden />;
  if (channel === "sms") return <Smartphone className={cls} aria-hidden />;
  return <MessageSquare className={cls} aria-hidden />;
}

function RoleBadge({ role }: { role: "Owner" | "Admin" | "Member" }) {
  const tone =
    role === "Owner"
      ? "bg-amber-500/15 text-amber-200"
      : role === "Admin"
        ? "bg-blue-500/15 text-blue-200"
        : "bg-[color-mix(in_oklab,var(--z-surface),white_8%)] text-[var(--z-muted)]";
  return (
    <span className={`rounded px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${tone}`}>
      {role}
    </span>
  );
}

export function ThreadParticipantsPanel({
  participants,
  threadChannelType,
  contextType,
  threadSubject,
}: ThreadParticipantsPanelProps) {
  const [open, setOpen] = useState(false);

  const rows = useMemo(
    () =>
      deriveThreadParticipants(
        participants,
        threadChannelType,
        contextType,
        threadSubject,
      ),
    [participants, threadChannelType, contextType, threadSubject],
  );

  const preview = useMemo(() => collapsedNamePreview(rows), [rows]);
  const n = rows.length;

  if (n === 0) return null;

  const stack = rows.slice(0, 4);

  return (
    <section className="shrink-0 rounded-lg border border-[var(--z-border)] bg-[var(--z-surface)]">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-3 rounded-t-lg px-3 py-2.5 text-left transition hover:bg-[var(--z-surface-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--z-accent)]"
        aria-expanded={open}
      >
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-[var(--z-fg)]">
            <span>Participants</span>
            <span className="text-[var(--z-muted)]">·</span>
            <span className="tabular-nums text-[var(--z-muted)]">{n}</span>
          </div>
          <div className="flex min-w-0 items-center gap-2">
            <div className="flex shrink-0 -space-x-2">
              {stack.map((r) => (
                <span
                  key={r.id}
                  className="relative inline-flex size-7 items-center justify-center rounded-full border border-[var(--z-border)] bg-[var(--z-surface-2)] text-[10px] font-bold text-[var(--z-fg)] first:ml-0"
                  title={r.name}
                >
                  {r.initials}
                  <span
                    className={`absolute -bottom-0.5 -right-0.5 size-2 rounded-full ring-2 ring-[var(--z-surface)] ${
                      r.activeNow ? "bg-emerald-400" : "bg-zinc-500"
                    }`}
                    title={r.presenceTooltip}
                    aria-label={r.presenceTooltip}
                  />
                </span>
              ))}
            </div>
            <p className="min-w-0 truncate text-[11px] text-[var(--z-muted)]">
              {preview}
              {n > 6 ? "…" : ""}
            </p>
          </div>
        </div>
        <ChevronDown
          className={`size-4 shrink-0 text-[var(--z-muted)] transition-transform ${open ? "rotate-180" : ""}`}
          aria-hidden
        />
      </button>

      <div
        className={`grid overflow-hidden transition-[grid-template-rows] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        }`}
      >
        <div className="min-h-0">
          <div className="space-y-3 border-t border-[var(--z-border)] px-3 pb-3 pt-2">
            {rows.map((r) => (
              <article
                key={r.id}
                className="flex gap-3 rounded-md border border-transparent px-1 py-1"
              >
                <div className="flex size-9 shrink-0 items-center justify-center rounded-full border border-[var(--z-border)] bg-[var(--z-surface-2)] text-[11px] font-bold text-[var(--z-fg)]">
                  {r.initials}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <ChannelGlyph channel={r.channel} />
                    <span
                      className={`inline-flex size-2 rounded-full ${
                        r.activeNow ? "bg-emerald-400" : "bg-zinc-500"
                      }`}
                      title={r.presenceTooltip}
                      aria-label={r.presenceTooltip}
                    />
                    <span className="truncate text-sm font-medium text-[var(--z-fg)]">
                      {r.name}
                    </span>
                    <RoleBadge role={r.memberRoleBadge} />
                  </div>
                  <p className="mt-0.5 text-[11px] text-[var(--z-muted)]">
                    {r.profileRole ? `${r.profileRole} · ` : ""}
                    {r.threadRoleLabel}
                  </p>
                  {r.email || r.phone ? (
                    <p className="mt-0.5 text-[11px] text-[var(--z-fg)]">
                      {[r.email, r.phone].filter(Boolean).join(" · ")}
                    </p>
                  ) : null}
                  {r.relationships.length > 0 ? (
                    <ul className="mt-1 space-y-0.5 text-[10px] text-[var(--z-muted)]">
                      {r.relationships.map((line, i) => (
                        <li key={i}>{line}</li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
