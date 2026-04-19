"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { ExportFormat, SavedReport } from "@/lib/reports/types";

export type SavedReportActionsProps = {
  report: SavedReport;
  tenantId: string;
};

export function SavedReportActions({ report, tenantId }: SavedReportActionsProps) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onExport = async (format: ExportFormat) => {
    setBusy(format);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch(
        `/reports/api/catalog/${report.id}/export?tenantId=${tenantId}`,
        {
          method: "POST",
          headers: {
            "content-type": "application/json",
            "x-tenant-id": tenantId,
          },
          body: JSON.stringify({ format }),
        },
      );
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error ?? "Export failed");
      const jobId = json?.data?.id as string | undefined;
      if (jobId) {
        const downloadUrl = `/reports/api/exports/${jobId}?tenantId=${tenantId}&download=1`;
        setMessage(`Export ready — ${format.toUpperCase()}.`);
        window.open(downloadUrl, "_blank");
      } else {
        setMessage("Export queued.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Export failed");
    } finally {
      setBusy(null);
    }
  };

  const onDelete = async () => {
    if (!window.confirm(`Delete "${report.name}"?`)) return;
    setBusy("delete");
    setError(null);
    try {
      const res = await fetch(
        `/reports/api/catalog/${report.id}?tenantId=${tenantId}`,
        {
          method: "DELETE",
          headers: { "x-tenant-id": tenantId },
        },
      );
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json?.error ?? "Delete failed");
      }
      router.push("/reports");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
      setBusy(null);
    }
  };

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex items-center gap-2">
        <ExportButton label="CSV" onClick={() => onExport("csv")} busy={busy === "csv"} />
        <ExportButton label="XLSX" onClick={() => onExport("xlsx")} busy={busy === "xlsx"} />
        <ExportButton label="PDF" onClick={() => onExport("pdf")} busy={busy === "pdf"} />
        <button
          type="button"
          onClick={onDelete}
          disabled={busy === "delete"}
          className="rounded-md border border-rose-500/30 px-2.5 py-1.5 text-xs font-semibold text-rose-300 hover:bg-rose-500/10 disabled:opacity-50"
        >
          Delete
        </button>
      </div>
      {message ? (
        <div className="text-[11px] text-emerald-400">{message}</div>
      ) : null}
      {error ? <div className="text-[11px] text-rose-400">{error}</div> : null}
    </div>
  );
}

function ExportButton({
  label,
  onClick,
  busy,
}: {
  label: string;
  onClick: () => void;
  busy: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={busy}
      className="rounded-md border border-[var(--z-border)] px-2.5 py-1.5 text-xs font-semibold text-[var(--z-fg)] hover:bg-white/5 disabled:opacity-50"
    >
      {busy ? `${label}…` : `Export ${label}`}
    </button>
  );
}
