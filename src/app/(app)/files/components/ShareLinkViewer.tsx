"use client";

import { useEffect, useState } from "react";
import { FilePreview } from "./previews/FilePreview";

export interface ShareLinkViewerProps {
  token: string;
}

function classify403Message(msg: string): "password" | "expired" | "limit" | "other" {
  const m = msg.toLowerCase();
  if (m.includes("password")) return "password";
  if (m.includes("expired")) return "expired";
  if (m.includes("view limit") || m.includes("max view")) return "limit";
  return "other";
}

export function ShareLinkViewer({ token }: ShareLinkViewerProps) {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(true);
  const [needsPassword, setNeedsPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorKind, setErrorKind] = useState<
    "not_found" | "expired" | "limit" | "forbidden" | "generic" | null
  >(null);
  const [data, setData] = useState<{
    file: { name: string; mimeType: string; size: number } | null;
    folder: { name: string; path: string } | null;
    signedUrl: { url: string; mimeType: string; fileName: string } | null;
    link: { allowDownload: boolean; viewCount: number; maxViews: number | null };
  } | null>(null);

  const load = async (pw?: string) => {
    setLoading(true);
    setError(null);
    setErrorKind(null);
    try {
      const qs = pw ? `?password=${encodeURIComponent(pw)}` : "";
      const res = await fetch(`/api/files/share/${token}${qs}`);
      if (res.status === 404) {
        setErrorKind("not_found");
        setError(
          "This link is invalid, was revoked, or the file is no longer shared.",
        );
        setData(null);
        return;
      }
      if (res.status === 403) {
        const body = await res.json().catch(() => ({}));
        const msg = String(body?.error ?? "Forbidden");
        const kind = classify403Message(msg);
        if (kind === "password") {
          setNeedsPassword(true);
          return;
        }
        if (kind === "expired") {
          setErrorKind("expired");
          setError(
            "This link has expired. Ask the sender for a new link or an updated invitation.",
          );
          return;
        }
        if (kind === "limit") {
          setErrorKind("limit");
          setError(
            "This link has reached its maximum number of views. Request a new link from the owner.",
          );
          return;
        }
        setErrorKind("forbidden");
        setError(msg.replace(/^FORBIDDEN:\s*/i, "") || "Access denied.");
        return;
      }
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setErrorKind("generic");
        setError(body?.error || `Error ${res.status}`);
        return;
      }
      const body = await res.json();
      setData(body.data ?? null);
      setNeedsPassword(false);
    } catch (err) {
      setErrorKind("generic");
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  if (loading && !data && !error && !needsPassword) {
    return (
      <div className="p-10 text-center text-sm text-[var(--z-muted)]" role="status">
        Loading…
      </div>
    );
  }
  if (needsPassword) {
    return (
      <div className="mx-auto max-w-sm rounded-md border border-[var(--z-border)] bg-[var(--z-surface)] p-5">
        <h2 className="text-base font-semibold text-[var(--z-fg)]">Password required</h2>
        <p className="mt-1 text-xs text-[var(--z-muted)]">
          Enter the password you received with this link to view the document.
        </p>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-3 w-full rounded-md border border-[var(--z-border)] bg-[var(--z-bg)] px-3 py-2 text-sm text-[var(--z-fg)]"
        />
        <button
          type="button"
          onClick={() => load(password)}
          className="mt-3 w-full rounded-md bg-[var(--z-accent)] px-3 py-2 text-sm font-semibold text-black hover:opacity-90"
        >
          Unlock
        </button>
        {error ? <div className="mt-2 text-xs text-red-400">{error}</div> : null}
      </div>
    );
  }
  if (error) {
    const title =
      errorKind === "not_found"
        ? "Link not available"
        : errorKind === "expired"
          ? "Link expired"
          : errorKind === "limit"
            ? "View limit reached"
            : errorKind === "forbidden"
              ? "Access denied"
              : "Something went wrong";
    return (
      <div className="mx-auto max-w-md space-y-3 rounded-md border border-red-500/35 bg-red-500/10 p-6 text-sm text-red-100">
        <h2 className="text-base font-semibold text-red-50">{title}</h2>
        <p className="text-xs leading-relaxed text-red-100/95">{error}</p>
        {errorKind === "expired" || errorKind === "limit" ? (
          <p className="text-[11px] text-red-200/90">
            Tip: expired and capped links are controlled by the owner — they can create a fresh
            link from Files → Share links.
          </p>
        ) : null}
      </div>
    );
  }
  if (!data) return null;

  return (
    <div className="space-y-4">
      <header>
        <div className="text-xs uppercase tracking-wider text-[var(--z-muted)]">
          Shared file
        </div>
        <h1 className="text-xl font-semibold text-[var(--z-fg)]">
          {data.file?.name ?? data.folder?.name ?? "Shared content"}
        </h1>
        <p className="mt-1 text-xs text-[var(--z-muted)]">
          {data.link.viewCount} view{data.link.viewCount === 1 ? "" : "s"}
          {data.link.maxViews != null ? ` · max ${data.link.maxViews}` : ""}
        </p>
      </header>
      {data.signedUrl?.url ? (
        <FilePreview
          url={data.signedUrl.url}
          mimeType={data.signedUrl.mimeType}
          name={data.signedUrl.fileName}
        />
      ) : (
        <div className="rounded-md border border-[var(--z-border)] bg-[var(--z-surface)] p-6 text-sm text-[var(--z-muted)]">
          This link points to a folder or is awaiting content.
        </div>
      )}
      {data.signedUrl?.url && data.link.allowDownload ? (
        <a
          href={data.signedUrl.url}
          target="_blank"
          rel="noreferrer"
          download={data.file?.name}
          className="inline-flex rounded-md border border-[var(--z-border)] px-3 py-1.5 text-xs text-[var(--z-fg)] hover:bg-white/[0.04]"
        >
          Download
        </a>
      ) : null}
    </div>
  );
}
