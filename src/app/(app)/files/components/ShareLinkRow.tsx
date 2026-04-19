"use client";

import { useEffect, useMemo, useState } from "react";
import { normalizeAccessTimestamp } from "@/lib/files/formatters";
import type { FileShareLink } from "@/lib/files/types";
import { showFilesToast } from "./filesToast";

type SharePermission = "view" | "upload" | "view-upload";
type ExpirationPreset = "24h" | "7d" | "30d" | "none" | "custom";

export type ShareLinkRowPatch = {
  expiresAt?: string | null;
  linkDisabled?: boolean;
  metadata?: Record<string, unknown>;
  password?: string | null;
};

export interface ShareLinkRowProps {
  link: FileShareLink;
  permissionOverride?: SharePermission;
  expirationOverride?: string | null;
  disabledOverride?: boolean;
  passwordEnabledOverride?: boolean;
  onUpdate: (linkId: string, patch: ShareLinkRowPatch) => Promise<void> | void;
  onDelete: (linkId: string) => Promise<void> | void;
  onOpenLogs: (linkId: string) => void;
  isCreating?: boolean;
}

function shareUrl(token: string): string {
  if (typeof window !== "undefined") return `${window.location.origin}/files/share/${token}`;
  return `/files/share/${token}`;
}

function toIsoDateInput(value: string | null | undefined): string {
  if (!value) return "";
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

function endOfDayIso(dateValue: string): string {
  return new Date(`${dateValue}T23:59:59.000Z`).toISOString();
}

function plusDaysIso(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 23, 59, 59, 0),
  ).toISOString();
}

function permissionLabel(value: SharePermission): string {
  if (value === "view") return "View only";
  if (value === "upload") return "Upload only";
  return "View + Upload";
}

function getLinkPermission(link: FileShareLink, permissionOverride?: SharePermission): SharePermission {
  if (permissionOverride) return permissionOverride;
  const raw = link.metadata?.permissionLevel;
  if (raw === "view" || raw === "upload" || raw === "view-upload") return raw;
  return "view";
}

function expirationPresetForValue(expiresAt: string | null | undefined): ExpirationPreset {
  if (!expiresAt) return "none";
  const date = new Date(expiresAt);
  if (!Number.isFinite(date.getTime())) return "custom";
  const dayMs = 24 * 60 * 60 * 1000;
  const deltaMs = date.getTime() - Date.now();
  if (deltaMs > 0.5 * dayMs && deltaMs < 1.5 * dayMs) return "24h";
  if (deltaMs > 6.5 * dayMs && deltaMs < 7.5 * dayMs) return "7d";
  if (deltaMs > 29.5 * dayMs && deltaMs < 30.5 * dayMs) return "30d";
  return "custom";
}

function isExpired(expiresAt: string | null | undefined): boolean {
  if (!expiresAt) return false;
  const date = new Date(expiresAt);
  if (!Number.isFinite(date.getTime())) return false;
  return date.getTime() < Date.now();
}

export function ShareLinkRow({
  link,
  permissionOverride,
  expirationOverride,
  disabledOverride,
  passwordEnabledOverride,
  onUpdate,
  onDelete,
  onOpenLogs,
  isCreating = false,
}: ShareLinkRowProps) {
  const [copied, setCopied] = useState(false);
  const [pending, setPending] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [entered, setEntered] = useState(!isCreating);
  const [passwordEnabled, setPasswordEnabled] = useState(
    Boolean(
      passwordEnabledOverride ??
        link.passwordHash ??
        link.metadata?.passwordEnabled,
    ),
  );
  const [password, setPassword] = useState("");
  const [expiresDate, setExpiresDate] = useState(toIsoDateInput(expirationOverride ?? link.expiresAt));
  const [preset, setPreset] = useState<ExpirationPreset>(
    expirationPresetForValue(expirationOverride ?? link.expiresAt),
  );

  const permission = useMemo(
    () => getLinkPermission(link, permissionOverride),
    [link, permissionOverride],
  );
  const disabled = disabledOverride ?? Boolean(link.metadata?.linkDisabled);
  const resolvedExpiresAt = expirationOverride ?? link.expiresAt;
  const lastAccessed = normalizeAccessTimestamp(
    (link.metadata ?? {}) as Record<string, unknown>,
  );
  const passwordProtected = Boolean(passwordEnabled || link.passwordHash || link.metadata?.passwordEnabled);
  const expired = isExpired(resolvedExpiresAt);

  useEffect(() => {
    setPasswordEnabled(
      Boolean(
        passwordEnabledOverride ??
          link.passwordHash ??
          link.metadata?.passwordEnabled,
      ),
    );
  }, [link.id, link.passwordHash, link.metadata, passwordEnabledOverride]);

  useEffect(() => {
    const nextExpiresAt = expirationOverride ?? link.expiresAt;
    setExpiresDate(toIsoDateInput(nextExpiresAt));
    setPreset(expirationPresetForValue(nextExpiresAt));
  }, [link.id, link.expiresAt, expirationOverride]);

  useEffect(() => {
    if (!isCreating) {
      setEntered(true);
      return;
    }
    setEntered(false);
    const raf = window.requestAnimationFrame(() => setEntered(true));
    return () => window.cancelAnimationFrame(raf);
  }, [isCreating]);

  const runUpdate = async (patch: ShareLinkRowPatch, successMessage?: string) => {
    setPending(true);
    try {
      await onUpdate(link.id, patch);
      if (successMessage) showFilesToast(successMessage, "success");
    } catch (err) {
      showFilesToast(err instanceof Error ? err.message : "Could not update link", "error");
      throw err;
    } finally {
      setPending(false);
    }
  };

  const handlePresetChange = async (nextPreset: ExpirationPreset) => {
    setPreset(nextPreset);
    if (nextPreset === "custom") return;
    const expiresAt =
      nextPreset === "none"
        ? null
        : nextPreset === "24h"
          ? plusDaysIso(1)
          : nextPreset === "7d"
            ? plusDaysIso(7)
            : plusDaysIso(30);
    setExpiresDate(toIsoDateInput(expiresAt));
    await runUpdate({ expiresAt }, "Expiration updated.");
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl(link.token));
      setCopied(true);
      showFilesToast("Link copied to clipboard.", "success");
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      showFilesToast("Could not copy link.", "error");
    }
  };

  const handlePasswordSave = async () => {
    const metadata = { ...(link.metadata ?? {}), passwordEnabled };
    await runUpdate(
      { metadata, password: passwordEnabled ? password || null : null },
      "Password setting updated.",
    );
    setPassword("");
  };

  const handleDelete = () => {
    if (pending || deleting) return;
    setDeleting(true);
    window.setTimeout(() => {
      void Promise.resolve(onDelete(link.id)).catch(() => setDeleting(false));
    }, 180);
  };

  return (
    <li
      className={[
        "rounded border border-[var(--z-border)] bg-white/[0.02] p-2 text-xs transition-all duration-200",
        deleting ? "translate-y-1 opacity-0" : entered ? "translate-y-0 opacity-100" : "translate-y-1 opacity-0",
        isCreating ? "animate-pulse" : "",
      ].join(" ")}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="truncate text-[var(--z-fg)]">{shareUrl(link.token)}</div>
          <div className="mt-1 text-[10px] text-[var(--z-muted)]">
            Created {new Date(link.createdAt).toLocaleString()}
          </div>
          <div
            className="text-[10px] text-[var(--z-muted)]"
            title={lastAccessed.iso || undefined}
          >
            Last accessed: {lastAccessed.relative}
          </div>
          <div className="text-[10px] text-[var(--z-muted)]">
            Expires {resolvedExpiresAt ? new Date(resolvedExpiresAt).toLocaleString() : "Never"}
          </div>
        </div>
        <div className="flex flex-wrap justify-end gap-1">
          {disabled ? (
            <span className="rounded-full border border-[var(--z-border)] bg-white/[0.04] px-2 py-0.5 text-[10px] text-[var(--z-muted)]">
              Disabled
            </span>
          ) : null}
          {expired ? (
            <span className="rounded-full border border-[var(--z-border)] bg-white/[0.04] px-2 py-0.5 text-[10px] text-[var(--z-muted)]">
              Expired
            </span>
          ) : null}
          {passwordProtected ? (
            <span className="rounded-full border border-[var(--z-border)] bg-white/[0.04] px-2 py-0.5 text-[10px] text-[var(--z-muted)]">
              Password
            </span>
          ) : null}
          {isCreating ? (
            <span className="rounded-full border border-[var(--z-border)] bg-white/[0.04] px-2 py-0.5 text-[10px] text-[var(--z-muted)]">
              Creating...
            </span>
          ) : null}
        </div>
      </div>

      <div className="mt-2 grid gap-2 md:grid-cols-2">
        <label className="text-[10px] text-[var(--z-muted)]">
          Permission
          <select
            value={permission}
            disabled={pending || deleting}
            className="mt-1 w-full rounded border border-[var(--z-border)] bg-[var(--z-bg)] px-2 py-1 text-xs text-[var(--z-fg)]"
            onChange={(event) =>
              void runUpdate(
                {
                  metadata: {
                    ...(link.metadata ?? {}),
                    permissionLevel: event.target.value as SharePermission,
                  },
                },
                "Permission updated.",
              )
            }
          >
            <option value="view">{permissionLabel("view")}</option>
            <option value="upload">{permissionLabel("upload")}</option>
            <option value="view-upload">{permissionLabel("view-upload")}</option>
          </select>
        </label>

        <label className="text-[10px] text-[var(--z-muted)]">
          Expiration preset
          <select
            value={preset}
            disabled={pending || deleting}
            className="mt-1 w-full rounded border border-[var(--z-border)] bg-[var(--z-bg)] px-2 py-1 text-xs text-[var(--z-fg)]"
            onChange={(event) => void handlePresetChange(event.target.value as ExpirationPreset)}
          >
            <option value="24h">24 hours</option>
            <option value="7d">7 days</option>
            <option value="30d">30 days</option>
            <option value="none">No expiration</option>
            <option value="custom">Custom date</option>
          </select>
        </label>
      </div>

      <label className="mt-2 block text-[10px] text-[var(--z-muted)]">
        Expires
        <input
          type="date"
          value={expiresDate}
          disabled={pending || deleting}
          onChange={(event) => {
            setPreset("custom");
            setExpiresDate(event.target.value);
          }}
          onBlur={() => {
            const expiresAt = expiresDate ? endOfDayIso(expiresDate) : null;
            void runUpdate({ expiresAt }, "Expiration updated.");
          }}
          className="mt-1 w-full rounded border border-[var(--z-border)] bg-[var(--z-bg)] px-2 py-1 text-xs text-[var(--z-fg)]"
        />
      </label>

      <div className="mt-2 space-y-1 rounded border border-[var(--z-border)] bg-[var(--z-bg)] p-2">
        <label className="flex items-center gap-2 text-[10px] text-[var(--z-muted)]">
          <input
            type="checkbox"
            checked={passwordEnabled}
            disabled={pending || deleting}
            onChange={(event) => setPasswordEnabled(event.target.checked)}
          />
          Password protect
        </label>
        {passwordEnabled ? (
          <input
            type="password"
            value={password}
            disabled={pending || deleting}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="new-password"
            placeholder="Set password"
            className="w-full rounded border border-[var(--z-border)] bg-[var(--z-surface)] px-2 py-1 text-[10px] text-[var(--z-fg)]"
          />
        ) : null}
        <div className="mt-1 flex flex-wrap gap-1">
          <button
            type="button"
            disabled={pending || deleting || (passwordEnabled && password.trim().length === 0)}
            onClick={() => void handlePasswordSave()}
            className="rounded border border-[var(--z-border)] px-2 py-1 text-[10px] hover:bg-white/[0.05] disabled:opacity-50"
          >
            Save password
          </button>
          <button
            type="button"
            disabled={pending || deleting}
            onClick={() =>
              void runUpdate(
                {
                  linkDisabled: !disabled,
                  metadata: { ...(link.metadata ?? {}), linkDisabled: !disabled },
                },
                disabled ? "Link enabled." : "Link disabled.",
              )
            }
            className="rounded border border-[var(--z-border)] px-2 py-1 text-[10px] hover:bg-white/[0.05]"
          >
            {disabled ? "Enable" : "Disable"}
          </button>
          <button
            type="button"
            onClick={() => onOpenLogs(link.id)}
            disabled={deleting}
            className="rounded border border-[var(--z-border)] px-2 py-1 text-[10px] hover:bg-white/[0.05]"
          >
            Access logs
          </button>
          <button
            type="button"
            onClick={() => void handleCopy()}
            disabled={deleting}
            className="rounded border border-[var(--z-border)] px-2 py-1 text-[10px] hover:bg-white/[0.05]"
          >
            {copied ? "Copied" : "Copy"}
          </button>
          <button
            type="button"
            disabled={pending || deleting}
            onClick={handleDelete}
            className="rounded border border-red-500/40 px-2 py-1 text-[10px] text-red-400 hover:bg-red-500/10 disabled:opacity-50"
          >
            Delete
          </button>
        </div>
      </div>
    </li>
  );
}


