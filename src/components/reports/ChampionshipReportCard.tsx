"use client";

import { useState } from "react";
import { Download, Eye } from "lucide-react";

export type ChampionshipReportData = {
  id: string;
  tenant_id: string;
  student_id: string;
  report_type: string;
  content: {
    framing?: string;
    status?: string;
    generated_at?: string;
    summary?: string;
    metrics?: Record<string, any>;
    [key: string]: any;
  };
  file_url: string | null;
  delivered_at: string | null;
  created_at: string;
};

interface ChampionshipReportCardProps {
  report: ChampionshipReportData;
  studentName: string;
}

export function ChampionshipReportCard({ report, studentName }: ChampionshipReportCardProps) {
  const [showPreview, setShowPreview] = useState(false);
  const createdDate = new Date(report.created_at);
  const formattedDate = createdDate.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  const reportTitle = `${report.report_type.charAt(0).toUpperCase() + report.report_type.slice(1)} Progress Mirror`;

  return (
    <div className="rounded-lg border border-[#1c1c1e] bg-[#0a0a0c] p-4 hover:border-[#00ff88]/30 transition-colors">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-[#d4d4d4]">{reportTitle}</h3>
          <p className="text-xs text-[#707078] mt-1">
            Generated {formattedDate}
            {report.delivered_at && (
              <>
                {" "}
                • Delivered {new Date(report.delivered_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
              </>
            )}
          </p>
        </div>

        {/* Status Badge */}
        {report.content?.status && (
          <span className="inline-flex items-center rounded-full bg-[#00ff88]/10 px-2.5 py-0.5 text-xs font-semibold text-[#00ff88]">
            {report.content.status}
          </span>
        )}
      </div>

      {/* Summary */}
      {report.content?.summary && (
        <p className="mt-3 text-sm text-[#909098] leading-relaxed">{report.content.summary}</p>
      )}

      {/* Metrics Grid (if available) */}
      {report.content?.metrics && Object.keys(report.content.metrics).length > 0 && (
        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {Object.entries(report.content.metrics).map(([key, value]) => (
            <div key={key} className="rounded-md bg-white/5 p-2">
              <div className="text-xs text-[#707078] capitalize">{key.replace(/_/g, " ")}</div>
              <div className="text-sm font-semibold text-[#d4d4d4]">{String(value)}</div>
            </div>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="mt-4 flex gap-2">
        {report.file_url && (
          <>
            <button
              onClick={() => setShowPreview(true)}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-md bg-white/5 px-3 py-2 text-xs font-semibold text-[#d4d4d4] hover:bg-white/10 transition-colors"
            >
              <Eye className="h-3.5 w-3.5" />
              Preview
            </button>
            <a
              href={report.file_url}
              download
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-md bg-[#00ff88]/10 px-3 py-2 text-xs font-semibold text-[#00ff88] hover:bg-[#00ff88]/20 transition-colors"
            >
              <Download className="h-3.5 w-3.5" />
              Download
            </a>
          </>
        )}
      </div>

      {/* Preview Modal */}
      {showPreview && report.file_url && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-auto rounded-lg bg-[#0a0a0c] border border-[#1c1c1e]">
            <div className="sticky top-0 flex items-center justify-between border-b border-[#1c1c1e] bg-[#0a0a0c] p-4">
              <h2 className="text-sm font-semibold text-[#d4d4d4]">{reportTitle}</h2>
              <button
                onClick={() => setShowPreview(false)}
                className="text-[#707078] hover:text-[#d4d4d4]"
              >
                ✕
              </button>
            </div>
            <iframe
              src={report.file_url}
              className="h-[70vh] w-full"
              title={reportTitle}
            />
          </div>
        </div>
      )}
    </div>
  );
}
