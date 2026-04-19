"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { FileShareLink } from "@/lib/files/types";
import { showFilesToast } from "./filesToast";

export interface ShareLinkManagerProps {
  fileId?: string | null;
  folderId?: string | null;
  shareLinks: FileShareLink[];
  canShare: boolean;
}

function buildUrl(token: string): string {
  if (typeof window !== "undefined") {
    return `${window.location.origin}/files/share/${token}`;
  }
  return `/files/share/${token}`;
}

const EXPIRY_PRESETS: { label: string; seconds: number | null }[] = [
  { label: "No expiry", seconds: null },
  { label: "1 hour", seconds: 3600 },
  { label: "24 hours", seconds: 24 * 3600 },
  { label: "7 days", seconds: 7 * 24 * 3600 },
  { label: "30 days", seconds: 30 * 24 * 3600 },
];

export function ShareLinkManager({
  fileId,
  folderId,
  shareLinks,
  canShare,
}: ShareLinkManagerProps) {
  const router = useRouter();
  const [usePassword, setUsePassword] = useState(false);
  const [password, setPassword] = useState("");
  const [maxViews, setMaxViews] = useState("");
  const [expiresSeconds, setExpiresSeconds] = useState<number | null>(null);
  const [allowDownload, setAllowDownload] = useState(true);
  const [watermarkPreview, setWatermarkPreview] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [emailOpen, setEmailOpen] = useState(false);
  const [emailTo, setEmailTo] = useState("");
  const [emailLink, setEmailLink] = useState("");

  const createLink = async () => {
    setBusy(true);
    setError(null);
    try {
      const body: Record<string, unknown> = {
        fileId: fileId ?? null,
        folderId: folderId ?? null,
        password: usePassword && password ? password : null,
        maxViews: maxViews ? Number(maxViews) : null,
        expiresInSeconds: expiresSeconds,
        allowDownload,
        metadata: {
          watermarkPreview,
        },
      };
      const res = await fetch("/api/files/share", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || `Failed (${res.status})`);
      }
      setPassword("");
      setMaxViews("");
      setExpiresSeconds(null);
      showFilesToast("Share link created.", "success");
      router.refresh();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
      showFilesToast(msg, "error");
    } finally {
      setBusy(false);
    }
  };

  const copyLink = async (link: FileShareLink) => {
    const text = buildUrl(link.token);
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(link.id);
      showFilesToast("Link copied to clipboard.", "success");
      window.setTimeout(() => setCopiedId(null), 2000);
    } catch {
      showFilesToast("Could not copy — copy manually.", "error");
    }
  };

  const setDisabled = async (link: FileShareLink, linkDisabled: boolean) => {
    const res = await fetch("/api/files/share", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id: link.id, linkDisabled }),
    });
    if (res.ok) {
      showFilesToast(linkDisabled ? "Link disabled." : "Link re-enabled.", "success");
      router.refresh();
    }
  };

  const revoke = async (id: string) => {
    if (!window.confirm("Revoke this share link?")) return;
    const res = await fetch(`/api/files/share?id=${id}`, { method: "DELETE" });
    if (res.ok) {
      showFilesToast("Share link revoked.", "success");
      router.refresh();
    }
  };

  return (
    <div className="rounded-md border border-[var(--z-border)] bg-[var(--z-surface)] p-4">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--z-muted)]">
        Share links
      </h3>
      {canShare ? (
        <div className="mt-3 space-y-3">
          <label className="block text-xs">
            <span className="mb-1 block text-[var(--z-muted)]">Expires</span>
            <select
              value={expiresSeconds === null ? "" : String(expiresSeconds)}
              onChange={(e) => {
                const v = e.target.value;
                setExpiresSeconds(v === "" ? null : Number(v));
              }}
              className="w-full rounded border border-[var(--z-border)] bg-[var(--z-bg)] px-2 py-1.5 text-xs text-[var(--z-fg)]"
            >
              {EXPIRY_PRESETS.map((p) => (
                <option
                  key={p.label}
                  value={p.seconds === null ? "" : String(p.seconds)}
                >
                  {p.label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-2 text-xs text-[var(--z-fg)]">
            <input
              type="checkbox"
              checked={usePassword}
              onChange={(e) => setUsePassword(e.target.checked)}
            />
            Require password
          </label>
          {usePassword ? (
            <label className="block text-xs">
              <span className="mb-1 block text-[var(--z-muted)]">Password</span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                className="w-full rounded border border-[var(--z-border)] bg-[var(--z-bg)] px-2 py-1.5 text-xs text-[var(--z-fg)]"
              />
            </label>
          ) : null}
          <label className="block text-xs">
            <span className="mb-1 block text-[var(--z-muted)]">Max views (optional)</span>
            <input
              type="number"
              min="0"
              value={maxViews}
              onChange={(e) => setMaxViews(e.target.value)}
              className="w-full rounded border border-[var(--z-border)] bg-[var(--z-bg)] px-2 py-1.5 text-xs text-[var(--z-fg)]"
            />
          </label>
          <label className="flex items-center gap-2 text-xs text-[var(--z-fg)]">
            <input
              type="checkbox"
              checked={allowDownload}
              onChange={(e) => setAllowDownload(e.target.checked)}
            />
            Allow download
          </label>
          <label className="flex items-center gap-2 text-xs text-[var(--z-fg)]">
            <input
              type="checkbox"
              checked={watermarkPreview}
              onChange={(e) => setWatermarkPreview(e.target.checked)}
            />
            Watermark preview (metadata flag)
          </label>
          <button
            type="button"
            onClick={createLink}
            disabled={busy}
            className="w-full rounded-md bg-[var(--z-accent)] px-3 py-1.5 text-xs font-semibold text-black hover:opacity-90 disabled:opacity-50"
          >
            Create share link
          </button>
          {error ? <div className="text-xs text-red-400">{error}</div> : null}
        </div>
      ) : null}

      <ul className="mt-3 space-y-2">
        {shareLinks.length === 0 ? (
          <li className="text-xs text-[var(--z-muted)]">No active share links.</li>
        ) : null}
        {shareLinks.map((link) => (
          <li
            key={link.id}
            className="flex items-center justify-between gap-2 rounded border border-[var(--z-border)] p-2 text-xs"
          >
            <div className="min-w-0">
              <div className="truncate text-[var(--z-fg)]">{buildUrl(link.token)}</div>
              <div className="mt-0.5 text-[var(--z-muted)]">
                {link.status} · {link.viewCount} views
                {link.metadata?.watermarkPreview ? " · watermarked" : ""}
                {link.expiresAt
                  ? ` · expires ${new Date(link.expiresAt).toLocaleString()}`
                  : ""}
              </div>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-1">
              <div className="flex flex-wrap justify-end gap-1">
                <button
                  type="button"
                  onClick={() => copyLink(link)}
                  className="rounded border border-[var(--z-border)] px-2 py-1 text-[var(--z-fg)] hover:bg-white/[0.04]"
                >
                  {copiedId === link.id ? "Copied" : "Copy"}
                </button>
                {canShare ? (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        setEmailLink(buildUrl(link.token));
                        setEmailOpen(true);
                      }}
                      className="rounded border border-[var(--z-border)] px-2 py-1 text-[var(--z-fg)] hover:bg-white/[0.04]"
                    >
                      Email
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        void setDisabled(link, !link.metadata?.linkDisabled)
                      }
                      className="rounded border border-[var(--z-border)] px-2 py-1 text-[var(--z-fg)] hover:bg-white/[0.04]"
                    >
                      {link.metadata?.linkDisabled ? "Enable" : "Disable"}
                    </button>
                    <button
                      type="button"
                      onClick={() => revoke(link.id)}
                      className="rounded border border-red-500/40 px-2 py-1 text-red-400 hover:bg-red-500/10"
                    >
                      Revoke
                    </button>
                  </>
                ) : null}
              </div>
            </div>
          </li>
        ))}
      </ul>

      {emailOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-lg border border-[var(--z-border)] bg-[var(--z-surface)] p-5 shadow-xl">
            <h4 className="text-sm font-semibold text-[var(--z-fg)]">Share via email</h4>
            <p className="mt-1 text-xs text-[var(--z-muted)]">
              Opens your mail client with a pre-filled message. For tracked threads, start
              a conversation from Inbox and paste this link.
            </p>
            <label className="mt-3 block text-xs">
              <span className="mb-1 block text-[var(--z-muted)]">Recipient</span>
              <input
                value={emailTo}
                onChange={(e) => setEmailTo(e.target.value)}
                type="email"
                className="w-full rounded border border-[var(--z-border)] bg-[var(--z-bg)] px-2 py-1.5 text-xs"
                placeholder="name@example.com"
              />
            </label>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                className="rounded border border-[var(--z-border)] px-3 py-1.5 text-xs"
                onClick={() => setEmailOpen(false)}
              >
                Cancel
              </button>
              <a
                href={
                  emailTo.trim()
                    ? `mailto:${emailTo.trim()}?subject=${encodeURIComponent("Shared file link")}&body=${encodeURIComponent(`Here is the link:\n${emailLink}`)}`
                    : "#"
                }
                className="rounded bg-[var(--z-accent)] px-3 py-1.5 text-xs font-semibold text-black"
                onClick={() => setEmailOpen(false)}
              >
                Open mail
              </a>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
