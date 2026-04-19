"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { AgentPanel } from "@/components/agent/AgentPanel";
import { StudentTimeline } from "@/components/students/StudentTimeline";
import { PageHeader } from "@/components/ui/PageHeader";
import { loadStudentSurface, type StudentSurfaceDTO } from "./actions";
import { PageTransition } from "@/components/system/PageTransition";
import { DEFAULT_TENANT_ID } from "@/lib/defaultTenantId";

type Tab = "profile" | "sessions" | "timeline";

type Invoice = {
  id: string;
  amount: number;
  status: string;
  due_date?: string | null;
  paid_date?: string | null;
  description?: string | null;
};

function invoiceStatusBadge(s: string) {
  const l = s.toLowerCase();
  if (l === "paid") return "bg-[#00ff88]/10 text-[#00ff88]";
  if (l === "overdue") return "bg-red-500/10 text-red-400";
  if (l === "pending") return "bg-amber-400/10 text-amber-400";
  return "bg-white/5 text-[#909098]";
}

function SessionsTab({ studentId }: { studentId: string }) {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/invoices?studentId=${studentId}`)
      .then((r) => r.json())
      .then((res) => {
        setInvoices(Array.isArray(res.data) ? res.data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [studentId]);

  if (loading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => <div key={i} className="h-12 animate-pulse rounded-lg bg-white/5" />)}
      </div>
    );
  }

  if (invoices.length === 0) {
    return <div className="text-sm text-[#505055]">No sessions or invoices found for this student.</div>;
  }

  const totalPaid = invoices.filter((i) => i.status === "paid").reduce((s, i) => s + i.amount, 0);
  const totalOutstanding = invoices.filter((i) => i.status !== "paid").reduce((s, i) => s + i.amount, 0);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div className="rounded-lg border border-[#1c1c1e] bg-[#0a0a0c] p-3">
          <div className="text-xs text-[#505055]">Total Sessions</div>
          <div className="text-xl font-bold text-white">{invoices.length}</div>
        </div>
        <div className="rounded-lg border border-[#1c1c1e] bg-[#0a0a0c] p-3">
          <div className="text-xs text-[#505055]">Total Paid</div>
          <div className="text-xl font-bold text-[#00ff88]">${totalPaid.toFixed(2)}</div>
        </div>
        <div className="rounded-lg border border-[#1c1c1e] bg-[#0a0a0c] p-3">
          <div className="text-xs text-[#505055]">Outstanding</div>
          <div className={`text-xl font-bold ${totalOutstanding > 0 ? "text-red-400" : "text-[#505055]"}`}>
            ${totalOutstanding.toFixed(2)}
          </div>
        </div>
      </div>
      <div className="space-y-2">
        {invoices.map((inv) => (
          <div key={inv.id} className="flex items-center gap-3 rounded-lg border border-[#1c1c1e] bg-[#0a0a0c] p-3">
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-white">${inv.amount.toFixed(2)}</div>
              <div className="text-xs text-[#505055]">
                {inv.description ?? "Session"} · Due {inv.due_date ?? "—"}
                {inv.paid_date ? ` · Paid ${inv.paid_date}` : ""}
              </div>
            </div>
            <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${invoiceStatusBadge(inv.status)}`}>
              {inv.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function StudentDetailLoaded({ studentId }: { studentId: string }) {
  const [data, setData] = useState<StudentSurfaceDTO | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("profile");

  useEffect(() => {
    let cancelled = false;
    void loadStudentSurface(studentId, DEFAULT_TENANT_ID).then((res) => {
      if (cancelled) return;
      setLoading(false);
      if (!res.ok) { setErr(res.error); setData(null); }
      else { setErr(null); setData(res.data); }
    });
    return () => { cancelled = true; };
  }, [studentId]);

  const agentStatus = useMemo(() => {
    if (!data) return "idle" as const;
    if (data.blockers.length > 0) return "blocked" as const;
    if (data.riskBand === "high") return "blocked" as const;
    return "active" as const;
  }, [data]);

  const TABS: { id: Tab; label: string }[] = [
    { id: "profile", label: "Profile" },
    { id: "sessions", label: "Sessions & Invoices" },
    { id: "timeline", label: "Timeline" },
  ];

  return (
    <PageTransition>
      <div className="mx-auto max-w-6xl space-y-6" data-tour="student-detail">
        {loading && <div className="text-sm text-[var(--z-muted)]">Loading…</div>}
        {err && <div className="text-sm text-[var(--z-danger)]">{err}</div>}
        {data && (
          <>
            <PageHeader title={data.studentName} subtitle={`${data.stageName} · ${data.riskBand} risk`} />
            <div className="flex gap-1 border-b border-[#1c1c1e]">
              {TABS.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`px-4 py-2.5 text-sm font-semibold transition-colors ${
                    tab === t.id
                      ? "border-b-2 border-[#00ff88] text-[#00ff88]"
                      : "text-[#505055] hover:text-[#909098]"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
            {tab === "profile" && (
              <AgentPanel
                agentName={data.agentDisplayName}
                avatarUrl={null}
                status={agentStatus}
                summary={data.agentSummary}
                nextActions={data.nextActions}
                currentStageName={data.stageName}
                blockers={data.blockers}
              />
            )}
            {tab === "sessions" && <SessionsTab studentId={studentId} />}
            {tab === "timeline" && <StudentTimeline events={data.timeline} />}
          </>
        )}
      </div>
    </PageTransition>
  );
}

export function StudentDetailClient() {
  const params = useParams();
  const studentId = String(params?.id ?? "");
  if (!studentId) {
    return (
      <div className="h-full overflow-y-auto overflow-x-hidden p-[var(--z-space-6)]">
        <p className="text-sm text-[var(--z-muted)]">Missing student id.</p>
      </div>
    );
  }
  return (
    <div className="h-full overflow-y-auto overflow-x-hidden p-[var(--z-space-6)]">
      <StudentDetailLoaded key={studentId} studentId={studentId} />
    </div>
  );
}
