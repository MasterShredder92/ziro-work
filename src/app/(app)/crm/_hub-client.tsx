"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { PageTransition } from "@/components/system/PageTransition";

// ─── Types ────────────────────────────────────────────────────────────────────
type Location = { id: string; name: string };
type Family = {
  id: string;
  name: string;
  primary_email?: string | null;
  primary_phone?: string | null;
  primary_location_id?: string | null;
  billing_status?: string | null;
  student_count?: number;
  balance_owed?: number;
};
type Student = {
  id: string;
  first_name: string;
  last_name: string;
  instrument?: string | null;
  status?: string | null;
  teacher_id?: string | null;
  rate_per_session?: number | null;
};
type Invoice = {
  id: string;
  amount: number;
  status: string;
  due_date?: string | null;
  paid_date?: string | null;
  description?: string | null;
};
type TimelineEvent = {
  id: string;
  type: string;
  label: string;
  timestamp: string;
  note?: string | null;
};

const INSTRUMENT_EMOJI: Record<string, string> = {
  guitar: "🎸", bass: "🎸", piano: "🎹", keyboard: "🎹",
  drums: "🥁", percussion: "🥁", violin: "🎻", viola: "🎻",
  cello: "🎻", trumpet: "🎺", trombone: "🎺", saxophone: "🎷",
  clarinet: "🎷", flute: "🎷", voice: "🎤", vocals: "🎤",
};
function instrEmoji(instr?: string | null) {
  if (!instr) return "🎵";
  const key = instr.toLowerCase();
  for (const [k, v] of Object.entries(INSTRUMENT_EMOJI)) {
    if (key.includes(k)) return v;
  }
  return "🎵";
}

function statusColor(s?: string | null) {
  if (!s) return "text-[#505055]";
  const l = s.toLowerCase();
  if (l === "active") return "text-[#00ff88]";
  if (l === "paused") return "text-amber-400";
  if (l === "inactive" || l === "cancelled") return "text-red-400";
  return "text-[#909098]";
}

function invoiceStatusBadge(s: string) {
  const l = s.toLowerCase();
  if (l === "paid") return "bg-[#00ff88]/10 text-[#00ff88]";
  if (l === "overdue") return "bg-red-500/10 text-red-400";
  if (l === "pending") return "bg-amber-400/10 text-amber-400";
  return "bg-white/5 text-[#909098]";
}

// ─── Family Detail Panel ──────────────────────────────────────────────────────
function FamilyDetailPanel({ family, onClose }: { family: Family; onClose: () => void }) {
  const [tab, setTab] = useState<"students" | "invoices" | "timeline">("students");
  const [students, setStudents] = useState<Student[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetch(`/api/crm/students?familyId=${family.id}`).then((r) => r.json()).catch(() => ({ data: [] })),
      fetch(`/api/invoices?familyId=${family.id}`).then((r) => r.json()).catch(() => ({ data: [] })),
    ]).then(([sRes, iRes]) => {
      setStudents(Array.isArray(sRes.data) ? sRes.data : []);
      setInvoices(Array.isArray(iRes.data) ? iRes.data : []);
      // Build a simple timeline from invoices + students
      const events: TimelineEvent[] = [];
      (Array.isArray(iRes.data) ? iRes.data : []).forEach((inv: Invoice) => {
        if (inv.paid_date) {
          events.push({ id: `inv-paid-${inv.id}`, type: "payment", label: `Payment received — $${inv.amount}`, timestamp: inv.paid_date });
        }
        events.push({ id: `inv-${inv.id}`, type: "invoice", label: `Invoice created — $${inv.amount} (${inv.status})`, timestamp: inv.due_date ?? "" });
      });
      events.sort((a, b) => (b.timestamp > a.timestamp ? 1 : -1));
      setTimeline(events);
      setLoading(false);
    });
  }, [family.id]);

  return (
    <div className="flex h-full flex-col border-l border-[#1c1c1e] bg-[#0a0a0c]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#1c1c1e] px-6 py-4">
        <div>
          <div className="text-base font-bold text-white">{family.name}</div>
          <div className="text-xs text-[#505055]">{family.primary_email ?? "—"} · {family.primary_phone ?? "—"}</div>
        </div>
        <button onClick={onClose} className="text-[#505055] hover:text-white transition-colors text-lg">✕</button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#1c1c1e] px-4">
        {(["students", "invoices", "timeline"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-3 text-xs font-semibold uppercase tracking-wider transition-colors ${
              tab === t ? "border-b-2 border-[#00ff88] text-[#00ff88]" : "text-[#505055] hover:text-[#909098]"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => <div key={i} className="h-12 animate-pulse rounded-lg bg-white/5" />)}
          </div>
        ) : (
          <>
            {tab === "students" && (
              <div className="space-y-2">
                {students.length === 0 ? (
                  <div className="text-sm text-[#505055]">No students linked to this family.</div>
                ) : students.map((s) => (
                  <Link
                    key={s.id}
                    href={`/students/${s.id}`}
                    className="flex items-center gap-3 rounded-lg border border-[#1c1c1e] bg-[#111113] p-3 hover:border-[#2b2b2f] hover:bg-white/3 transition-colors"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#1c1c1e] text-lg">
                      {instrEmoji(s.instrument)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-white truncate">{s.first_name} {s.last_name}</div>
                      <div className="text-xs text-[#505055]">{s.instrument ?? "—"}</div>
                    </div>
                    <span className={`text-xs font-semibold ${statusColor(s.status)}`}>{s.status ?? "—"}</span>
                    <span className="text-[#303035] text-xs">→</span>
                  </Link>
                ))}
                <Link
                  href={`/crm/students/new?familyId=${family.id}`}
                  className="mt-2 flex items-center justify-center gap-2 rounded-lg border border-dashed border-[#2b2b2f] p-3 text-xs font-semibold text-[#505055] hover:border-[#00ff88]/30 hover:text-[#00ff88] transition-colors"
                >
                  + Add student
                </Link>
              </div>
            )}

            {tab === "invoices" && (
              <div className="space-y-2">
                {invoices.length === 0 ? (
                  <div className="text-sm text-[#505055]">No invoices found for this family.</div>
                ) : invoices.map((inv) => (
                  <div key={inv.id} className="flex items-center gap-3 rounded-lg border border-[#1c1c1e] bg-[#111113] p-3">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-white">${inv.amount.toFixed(2)}</div>
                      <div className="text-xs text-[#505055]">{inv.description ?? "Session"} · Due {inv.due_date ?? "—"}</div>
                    </div>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${invoiceStatusBadge(inv.status)}`}>
                      {inv.status}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {tab === "timeline" && (
              <div className="space-y-0">
                {timeline.length === 0 ? (
                  <div className="text-sm text-[#505055]">No timeline events yet.</div>
                ) : timeline.map((ev, i) => (
                  <div key={ev.id} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className={`mt-1 h-2 w-2 rounded-full shrink-0 ${ev.type === "payment" ? "bg-[#00ff88]" : "bg-[#2b2b2f]"}`} />
                      {i < timeline.length - 1 && <div className="w-px flex-1 bg-[#1c1c1e]" />}
                    </div>
                    <div className="pb-4 min-w-0">
                      <div className="text-xs font-semibold text-[#d4d4d4]">{ev.label}</div>
                      <div className="text-[10px] text-[#505055]">{ev.timestamp}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ─── Main CRM Hub ─────────────────────────────────────────────────────────────
export function CRMHubClient() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [selectedLocationId, setSelectedLocationId] = useState<string>("all");
  const [families, setFamilies] = useState<Family[]>([]);
  const [selectedFamily, setSelectedFamily] = useState<Family | null>(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  // Load locations
  useEffect(() => {
    fetch("/api/locations/options")
      .then((r) => r.json())
      .then((res) => {
        const locs: Location[] = Array.isArray(res.data) ? res.data : [];
        setLocations(locs);
      })
      .catch(() => {});
  }, []);

  // Load families when location changes
  const loadFamilies = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (selectedLocationId !== "all") params.set("locationId", selectedLocationId);
    if (search) params.set("search", search);
    fetch(`/api/crm/families?${params}`)
      .then((r) => r.json())
      .then((res) => {
        setFamilies(Array.isArray(res.data) ? res.data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [selectedLocationId, search]);

  useEffect(() => {
    const t = setTimeout(loadFamilies, 300);
    return () => clearTimeout(t);
  }, [loadFamilies]);

  const locationName = (id: string) => {
    if (id === "all") return "All Locations";
    return locations.find((l) => l.id === id)?.name ?? id;
  };

  return (
    <PageTransition>
      <div className="flex h-[calc(100vh-56px)] flex-col overflow-hidden">
        {/* Header */}
        <div className="shrink-0 border-b border-[#1c1c1e] px-6 py-4">
          <div className="flex items-center justify-between gap-4">
            <PageHeader title="Families & Students" subtitle="All families, students, and their session history" />
            <Link
              href="/crm/families/new"
              className="shrink-0 rounded-lg bg-[#00ff88]/10 px-4 py-2 text-sm font-semibold text-[#00ff88] hover:bg-[#00ff88]/20 transition-colors"
            >
              + New Family
            </Link>
          </div>

          {/* Location pills */}
          <div className="mt-3 flex flex-wrap gap-2">
            {["all", ...locations.map((l) => l.id)].map((locId) => (
              <button
                key={locId}
                onClick={() => { setSelectedLocationId(locId); setSelectedFamily(null); }}
                className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                  selectedLocationId === locId
                    ? "bg-[#00ff88]/15 text-[#00ff88] border border-[#00ff88]/30"
                    : "border border-[#1c1c1e] text-[#505055] hover:text-[#909098] hover:border-[#2b2b2f]"
                }`}
              >
                {locationName(locId)}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="mt-3">
            <input
              type="text"
              placeholder="Search families..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-[#1c1c1e] bg-[#111113] px-3 py-2 text-sm text-white placeholder-[#404048] focus:border-[#00ff88]/30 focus:outline-none"
            />
          </div>
        </div>

        {/* Body: list + detail */}
        <div className="flex flex-1 overflow-hidden">
          {/* Family list */}
          <div className={`flex flex-col overflow-y-auto border-r border-[#1c1c1e] transition-all duration-200 ${selectedFamily ? "w-80 shrink-0" : "flex-1"}`}>
            {loading ? (
              <div className="p-4 space-y-2">
                {[1,2,3,4,5].map((i) => <div key={i} className="h-16 animate-pulse rounded-lg bg-white/5" />)}
              </div>
            ) : families.length === 0 ? (
              <div className="flex flex-col items-center justify-center flex-1 gap-3 text-center p-8">
                <div className="text-4xl">👨‍👩‍👧</div>
                <div className="text-sm font-semibold text-[#909098]">No families found</div>
                <div className="text-xs text-[#505055]">
                  {search ? "Try a different search term" : "Add your first family to get started"}
                </div>
              </div>
            ) : (
              <div className="divide-y divide-[#1c1c1e]">
                {families.map((fam) => (
                  <button
                    key={fam.id}
                    onClick={() => setSelectedFamily(fam.id === selectedFamily?.id ? null : fam)}
                    className={`w-full text-left px-4 py-3 hover:bg-white/3 transition-colors ${
                      selectedFamily?.id === fam.id ? "bg-[#00ff88]/5 border-l-2 border-[#00ff88]" : ""
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#1c1c1e] text-sm font-bold text-[#909098]">
                        {fam.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-white truncate">{fam.name}</div>
                        <div className="text-xs text-[#505055] truncate">{fam.primary_email ?? "—"}</div>
                      </div>
                      {fam.balance_owed != null && fam.balance_owed > 0 && (
                        <span className="shrink-0 text-xs font-semibold text-red-400">${fam.balance_owed.toFixed(0)} owed</span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Family detail */}
          {selectedFamily && (
            <div className="flex-1 overflow-hidden">
              <FamilyDetailPanel family={selectedFamily} onClose={() => setSelectedFamily(null)} />
            </div>
          )}
        </div>
      </div>
    </PageTransition>
  );
}
