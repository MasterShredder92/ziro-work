"use client";

import { useState } from "react";
import type { FeatureFlag } from "@/lib/admin/adminTypes";

export type FeatureFlagToggleProps = {
  tenantId: string;
  flag: FeatureFlag;
  canWrite: boolean;
  onUpdated?: (next: FeatureFlag) => void;
};

export function FeatureFlagToggle({
  tenantId,
  flag,
  canWrite,
  onUpdated,
}: FeatureFlagToggleProps) {
  const [enabled, setEnabled] = useState(flag.enabled);
  const [rollout, setRollout] = useState(flag.rollout_percent);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save(nextEnabled: boolean, nextRollout: number) {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/admin/feature-flags?tenantId=${encodeURIComponent(tenantId)}`,
        {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            id: flag.id,
            key: flag.key,
            enabled: nextEnabled,
            rollout_percent: nextRollout,
          }),
        },
      );
      const data = (await res.json().catch(() => null)) as {
        data?: FeatureFlag;
        error?: string;
      } | null;
      if (!res.ok) throw new Error(data?.error ?? `HTTP ${res.status}`);
      if (data?.data) onUpdated?.(data.data);
    } catch (err) {
      setEnabled(flag.enabled);
      setRollout(flag.rollout_percent);
      setError(err instanceof Error ? err.message : "Failed to update flag");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-2 rounded-[var(--z-radius-md)] border border-[var(--z-border)] bg-[var(--z-surface)] p-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="font-semibold text-[var(--z-fg)]">{flag.name}</div>
          <div className="font-mono text-xs text-[var(--z-muted)]">{flag.key}</div>
          {flag.description ? (
            <p className="mt-1 text-xs text-[var(--z-muted)]">
              {flag.description}
            </p>
          ) : null}
        </div>
        <label className="inline-flex shrink-0 items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={enabled}
            disabled={!canWrite || saving}
            onChange={(e) => {
              const v = e.target.checked;
              setEnabled(v);
              void save(v, rollout);
            }}
          />
          <span>{enabled ? "Enabled" : "Disabled"}</span>
        </label>
      </div>

      <div className="flex items-center gap-3">
        <label className="flex flex-1 flex-col gap-1">
          <span className="text-[10px] uppercase tracking-wider text-[var(--z-muted)]">
            Rollout {rollout}%
          </span>
          <input
            type="range"
            min={0}
            max={100}
            step={5}
            value={rollout}
            disabled={!canWrite || saving}
            onChange={(e) => setRollout(Number(e.target.value))}
            onMouseUp={() => void save(enabled, rollout)}
            onTouchEnd={() => void save(enabled, rollout)}
          />
        </label>
      </div>

      {flag.target_roles.length > 0 ? (
        <div className="text-xs text-[var(--z-muted)]">
          Target roles:{" "}
          {flag.target_roles.map((r) => (
            <span
              key={r}
              className="mr-1 rounded-full border border-[var(--z-border)] px-2 py-0.5 font-mono"
            >
              {r}
            </span>
          ))}
        </div>
      ) : null}

      {error ? (
        <div className="text-xs text-red-400">{error}</div>
      ) : null}
    </div>
  );
}
