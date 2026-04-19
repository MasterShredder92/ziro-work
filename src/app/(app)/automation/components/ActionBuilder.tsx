"use client";

import type { AutomationAction } from "@/lib/automation/types";

const KINDS: AutomationAction["kind"][] = [
  "runSkill",
  "sendMessage",
  "createNote",
  "scheduleFollowup",
];

export type ActionBuilderProps = {
  actions: AutomationAction[];
  onChange: (next: AutomationAction[]) => void;
  disabled?: boolean;
};

function defaultActionFor(kind: AutomationAction["kind"]): AutomationAction {
  switch (kind) {
    case "runSkill":
      return { kind, skillId: "ziro.kpiSnapshot" };
    case "sendMessage":
      return { kind, profileId: "", body: "" };
    case "createNote":
      return { kind, entityId: "", body: "", entityType: "student" };
    case "scheduleFollowup":
      return {
        kind,
        profileId: "",
        date: new Date(Date.now() + 86_400_000).toISOString().slice(0, 10),
        note: "",
      };
    default:
      return { kind: "runSkill", skillId: "ziro.kpiSnapshot" };
  }
}

export function ActionBuilder({ actions, onChange, disabled }: ActionBuilderProps) {
  const add = (kind: AutomationAction["kind"]) => {
    onChange([...actions, defaultActionFor(kind)]);
  };

  const remove = (index: number) => {
    onChange(actions.filter((_, i) => i !== index));
  };

  const update = (index: number, patch: Partial<AutomationAction>) => {
    const next = actions.slice();
    next[index] = { ...next[index], ...patch } as AutomationAction;
    onChange(next);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-[11px] uppercase tracking-wider font-semibold text-[var(--z-muted)]">
          Actions (run in order)
        </label>
        <div className="flex flex-wrap gap-2">
          {KINDS.map((k) => (
            <button
              key={k}
              type="button"
              disabled={disabled}
              onClick={() => add(k)}
              className="text-[11px] font-semibold text-[var(--z-accent)] hover:underline disabled:opacity-50"
            >
              + {k}
            </button>
          ))}
        </div>
      </div>

      {actions.length === 0 ? (
        <div className="text-xs text-[var(--z-muted)] italic">
          No actions yet. Add one to define what the rule does.
        </div>
      ) : (
        <div className="space-y-2">
          {actions.map((a, i) => (
            <div
              key={i}
              className="rounded-[var(--z-radius-md)] border border-[var(--z-border)] bg-[var(--z-surface-2)] p-3 space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-[var(--z-accent)]">
                  {a.kind}
                </span>
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => remove(i)}
                  className="text-xs text-[var(--z-danger)] hover:underline disabled:opacity-50"
                >
                  Remove
                </button>
              </div>

              {a.kind === "runSkill" ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={a.skillId}
                    disabled={disabled}
                    placeholder="agent.skill"
                    onChange={(e) => update(i, { skillId: e.target.value })}
                    className="rounded border border-[var(--z-border)] bg-[var(--z-surface)] px-2 py-1 text-xs font-mono text-[var(--z-fg)]"
                  />
                  <input
                    type="text"
                    value={a.input ?? ""}
                    disabled={disabled}
                    placeholder="input"
                    onChange={(e) => update(i, { input: e.target.value })}
                    className="rounded border border-[var(--z-border)] bg-[var(--z-surface)] px-2 py-1 text-xs text-[var(--z-fg)]"
                  />
                </div>
              ) : null}

              {a.kind === "sendMessage" ? (
                <div className="space-y-2">
                  <input
                    type="text"
                    value={a.profileId}
                    disabled={disabled}
                    placeholder="target profileId"
                    onChange={(e) => update(i, { profileId: e.target.value })}
                    className="w-full rounded border border-[var(--z-border)] bg-[var(--z-surface)] px-2 py-1 text-xs font-mono text-[var(--z-fg)]"
                  />
                  <textarea
                    value={a.body}
                    disabled={disabled}
                    placeholder="Message body"
                    rows={3}
                    onChange={(e) => update(i, { body: e.target.value })}
                    className="w-full rounded border border-[var(--z-border)] bg-[var(--z-surface)] px-2 py-1 text-xs text-[var(--z-fg)]"
                  />
                </div>
              ) : null}

              {a.kind === "createNote" ? (
                <div className="space-y-2">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={a.entityId}
                      disabled={disabled}
                      placeholder="entityId"
                      onChange={(e) => update(i, { entityId: e.target.value })}
                      className="rounded border border-[var(--z-border)] bg-[var(--z-surface)] px-2 py-1 text-xs font-mono text-[var(--z-fg)]"
                    />
                    <input
                      type="text"
                      value={a.entityType ?? ""}
                      disabled={disabled}
                      placeholder="entityType (student, lead, ...)"
                      onChange={(e) => update(i, { entityType: e.target.value })}
                      className="rounded border border-[var(--z-border)] bg-[var(--z-surface)] px-2 py-1 text-xs text-[var(--z-fg)]"
                    />
                  </div>
                  <textarea
                    value={a.body}
                    disabled={disabled}
                    placeholder="Note body"
                    rows={3}
                    onChange={(e) => update(i, { body: e.target.value })}
                    className="w-full rounded border border-[var(--z-border)] bg-[var(--z-surface)] px-2 py-1 text-xs text-[var(--z-fg)]"
                  />
                </div>
              ) : null}

              {a.kind === "scheduleFollowup" ? (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <input
                    type="text"
                    value={a.profileId}
                    disabled={disabled}
                    placeholder="profileId"
                    onChange={(e) => update(i, { profileId: e.target.value })}
                    className="rounded border border-[var(--z-border)] bg-[var(--z-surface)] px-2 py-1 text-xs font-mono text-[var(--z-fg)]"
                  />
                  <input
                    type="date"
                    value={a.date?.slice(0, 10) ?? ""}
                    disabled={disabled}
                    onChange={(e) => update(i, { date: e.target.value })}
                    className="rounded border border-[var(--z-border)] bg-[var(--z-surface)] px-2 py-1 text-xs text-[var(--z-fg)]"
                  />
                  <input
                    type="text"
                    value={a.note ?? ""}
                    disabled={disabled}
                    placeholder="note"
                    onChange={(e) => update(i, { note: e.target.value })}
                    className="rounded border border-[var(--z-border)] bg-[var(--z-surface)] px-2 py-1 text-xs text-[var(--z-fg)]"
                  />
                </div>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
