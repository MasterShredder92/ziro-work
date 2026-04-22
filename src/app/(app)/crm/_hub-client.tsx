"use client";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PageTransition } from "@/components/system/PageTransition";
import { LOCATION_MAP, LOCATIONS } from "@/lib/config/locations";

type Family = {
  id: string;
  name: string;
  primary_email?: string | null;
  primary_phone?: string | null;
  primary_location_id?: string | null;
  billing_status?: string | null;
  student_count?: number;
  balance_owed?: number;
  lifetime_paid?: number;
  is_military?: boolean;
  autopay_enabled?: boolean;
  students?: { instrument?: string | null; status?: string | null }[];
};

const INSTRUMENT_COLORS: Record<string, string> = {
  piano: "#6366f1", keyboard: "#6366f1",
  guitar: "#f59e0b", bass: "#f59e0b",
  vocals: "#ec4899", voice: "#ec4899",
  drums: "#ef4444", percussion: "#ef4444",
  violin: "#8b5cf6", viola: "#8b5cf6", cello: "#8b5cf6",
  trumpet: "#06b6d4", trombone: "#06b6d4",
  saxophone: "#10b981", clarinet: "#10b981", flute: "#10b981",
};

function instrColor(instr?: string | null): string {
  if (!instr) return "#505055";
  const key = instr.toLowerCase();
  for (const [k, v] of Object.entries(INSTRUMENT_COLORS)) {
    if (key.includes(k)) return v;
  }
  return "#505055";
}

function initials(name: string): string {
  return name.replace(/\s+Family$/i, "").trim().slice(0, 2).toUpperCase();
}

function displayName(name: string): string {
  return name.replace(/\s+Family$/i, "").trim();
}

type SortKey = "name" | "students" | "balance" | "lifetime";
type SortDir = "asc" | "desc";

export function CRMHubClient() {
  const router = useRouter();
  const [families, setFamilies] = useState<Family[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [locationFilter, setLocationFilter] = useState("all");
  const [billingFilter, setBillingFilter] = useState("all");
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const loadFamilies = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (locationFilter !== "all") params.set("locationId", locationFilter);
    if (search) params.set("search", search);
    fetch(`/api/crm/families?${params}`)
      .then(r => r.json())
      .then(res => {
        setFamilies(Array.isArray(res.data) ? res.data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [locationFilter, search]);

  useEffect(() => {
    const t = setTimeout(loadFamilies, 300);
    return () => clearTimeout(t);
  }, [loadFamilies]);

  const filtered = families
    .filter(f => {
      if (billingFilter === "overdue") return f.billing_status?.toLowerCase() === "overdue";
      if (billingFilter === "current") return f.billing_status?.toLowerCase() === "current";
      if (billingFilter === "none") return !f.billing_status || f.billing_status === "none" || f.billing_status === "no_invoice";
      return true;
    })
    .sort((a, b) => {
      let cmp = 0;
      if (sortKey === "name") cmp = displayName(a.name).localeCompare(displayName(b.name));
      else if (sortKey === "students") cmp = (a.student_count ?? 0) - (b.student_count ?? 0);
      else if (sortKey === "balance") cmp = (a.balance_owed ?? 0) - (b.balance_owed ?? 0);
      else if (sortKey === "lifetime") cmp = (a.lifetime_paid ?? 0) - (b.lifetime_paid ?? 0);
      return sortDir === "asc" ? cmp : -cmp;
    });

  const overdue = filtered.filter(f => f.billing_status?.toLowerCase() === "overdue");
  const rest = filtered.filter(f => f.billing_status?.toLowerCase() !== "overdue");
  const sorted = [...overdue, ...rest];
  const overdueCount = families.filter(f => f.billing_status?.toLowerCase() === "overdue").length;

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("asc"); }
  }

  function SortIcon({ k }: { k: SortKey }) {
    if (sortKey !== k) return <span className="text-[var(--z-muted)] ml-1">↕</span>;
    return <span className="text-[var(--z-accent)] ml-1">{sortDir === "asc" ? "↑" : "↓"}</span>;
  }

  const knownLocations = [
    { id: "all", name: "All Locations" },
    ...LOCATIONS.map(l => ({ id: l.id, name: l.name })),
  ];

  return (
    <PageTransition>
      <div className="flex flex-col h-full min-h-screen bg-[var(--z-bg)]">
        <div className="border-b border-[var(--z-border)] px-6 py-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-xl font-bold text-[var(--z-fg)]">Families &amp; Students</h1>
              <p className="text-xs text-[var(--z-muted)] mt-0.5">
                {sorted.length} of {families.length} total
                {overdueCount > 0 && (
                  <span className="ml-2 text-red-400 font-semibold">{overdueCount} overdue</span>
                )}
              </p>
            </div>
            <Link
              href="/crm/families/new"
              className="rounded-xl bg-[var(--z-accent)] px-4 py-2 text-xs font-bold text-black hover:opacity-90 transition-opacity"
            >
              + New Family
            </Link>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <input
              type="text"
              placeholder="Search families, contacts, email, phone…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="rounded-lg border border-[var(--z-border)] bg-[var(--z-surface)] px-3 py-1.5 text-sm text-[var(--z-fg)] placeholder-[var(--z-muted)] focus:border-[var(--z-accent)]/40 focus:outline-none w-72"
            />
            <select
              value={locationFilter}
              onChange={e => setLocationFilter(e.target.value)}
              className="rounded-lg border border-[var(--z-border)] bg-[var(--z-surface)] px-3 py-1.5 text-sm text-[var(--z-fg)] focus:outline-none"
            >
              {knownLocations.map(l => (
                <option key={l.id} value={l.id}>{l.name}</option>
              ))}
            </select>
            <select
              value={billingFilter}
              onChange={e => setBillingFilter(e.target.value)}
              className="rounded-lg border border-[var(--z-border)] bg-[var(--z-surface)] px-3 py-1.5 text-sm text-[var(--z-fg)] focus:outline-none"
            >
              <option value="all">All Billing</option>
              <option value="overdue">Overdue</option>
              <option value="current">Current</option>
              <option value="none">No Invoice</option>
            </select>
          </div>
        </div>

        <div className="flex-1 overflow-auto">
          {loading ? (
            <div className="p-6 space-y-2">
              {[1,2,3,4,5,6,7,8].map(i => (
                <div key={i} className="h-14 animate-pulse rounded-lg bg-[var(--z-surface)]" />
              ))}
            </div>
          ) : sorted.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 gap-3 text-center">
              <div className="text-4xl">👨‍👩‍👧</div>
              <p className="text-sm font-semibold text-[var(--z-muted)]">No families found</p>
              <p className="text-xs text-[var(--z-muted)]">
                {search ? "Try a different search term" : "Add your first family to get started"}
              </p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--z-border)] bg-[var(--z-surface)]">
                  <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-[var(--z-muted)] cursor-pointer hover:text-[var(--z-fg)] transition-colors" onClick={() => toggleSort("name")}>
                    FAMILY<SortIcon k="name" />
                  </th>
                  <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-[var(--z-muted)]">CONTACT</th>
                  <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-[var(--z-muted)] cursor-pointer hover:text-[var(--z-fg)] transition-colors" onClick={() => toggleSort("students")}>
                    STUDENTS<SortIcon k="students" />
                  </th>
                  <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-[var(--z-muted)]">LOCATION</th>
                  <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-[var(--z-muted)]">BILLING</th>
                  <th className="px-5 py-3 text-right text-[10px] font-bold uppercase tracking-widest text-[var(--z-muted)] cursor-pointer hover:text-[var(--z-fg)] transition-colors" onClick={() => toggleSort("balance")}>
                    BALANCE<SortIcon k="balance" />
                  </th>
                  <th className="px-5 py-3 text-right text-[10px] font-bold uppercase tracking-widest text-[var(--z-muted)] cursor-pointer hover:text-[var(--z-fg)] transition-colors" onClick={() => toggleSort("lifetime")}>
                    LIFETIME<SortIcon k="lifetime" />
                  </th>
                  <th className="px-5 py-3 text-right text-[10px] font-bold uppercase tracking-widest text-[var(--z-muted)]">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--z-border)]">
                {sorted.map(fam => {
                  const locCfg = fam.primary_location_id ? LOCATION_MAP[fam.primary_location_id] : null;
                  const isOverdue = fam.billing_status?.toLowerCase() === "overdue";
                  const instruments = fam.students?.map(s => s.instrument).filter(Boolean) ?? [];

                  return (
                    <tr
                      key={fam.id}
                      className={`group transition-colors hover:bg-[var(--z-surface)] cursor-pointer ${isOverdue ? "bg-red-500/3" : ""}`}
                      onClick={() => router.push(`/crm/families/${fam.id}`)}
                    >
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          {locCfg ? (
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold"
                              style={{ backgroundColor: `${locCfg.color}20`, border: `1.5px solid ${locCfg.color}50`, color: locCfg.color }}>
                              {initials(fam.name)}
                            </div>
                          ) : (
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--z-surface)] border border-[var(--z-border)] text-xs font-bold text-[var(--z-muted)]">
                              {initials(fam.name)}
                            </div>
                          )}
                          <div>
                            <p className="font-semibold text-[var(--z-fg)]">
                              {displayName(fam.name)}
                              {fam.is_military && <span className="ml-1.5 text-[10px]">🎖</span>}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <div className="space-y-0.5">
                          {fam.primary_email && <p className="text-xs text-[var(--z-muted)] truncate max-w-[180px]">{fam.primary_email}</p>}
                          {fam.primary_phone && <p className="text-xs text-[var(--z-muted)]">{fam.primary_phone}</p>}
                          {!fam.primary_email && !fam.primary_phone && <p className="text-xs text-[var(--z-muted)]">—</p>}
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-sm font-semibold text-[var(--z-fg)]">{fam.student_count ?? 0}</span>
                          {instruments.slice(0, 4).map((instr, i) => (
                            <span key={i} className="rounded-full px-2 py-0.5 text-[10px] font-bold capitalize"
                              style={{ backgroundColor: `${instrColor(instr)}20`, color: instrColor(instr) }}>
                              {instr}
                            </span>
                          ))}
                          {instruments.length > 4 && <span className="text-[10px] text-[var(--z-muted)]">+{instruments.length - 4}</span>}
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        {locCfg ? (
                          <span className="rounded-full px-2.5 py-1 text-[10px] font-bold"
                            style={{ backgroundColor: `${locCfg.color}15`, color: locCfg.color }}>
                            {locCfg.name}
                          </span>
                        ) : (
                          <span className="text-xs text-[var(--z-muted)]">—</span>
                        )}
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-1.5">
                          {isOverdue && <span className="rounded-full bg-red-500/10 px-2.5 py-0.5 text-[10px] font-bold text-red-400 uppercase">Overdue</span>}
                          {!isOverdue && fam.billing_status?.toLowerCase() === "current" && <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-bold text-emerald-400 uppercase">Current</span>}
                          {!isOverdue && (!fam.billing_status || fam.billing_status === "none" || fam.billing_status === "no_invoice") && (
                            <span className="rounded-full bg-[var(--z-surface)] px-2.5 py-0.5 text-[10px] font-bold text-[var(--z-muted)] uppercase border border-[var(--z-border)]">No Invoice</span>
                          )}
                          {fam.autopay_enabled && <span className="text-[9px] text-emerald-400 font-bold">AUTO</span>}
                        </div>
                      </td>
                      <td className="px-5 py-3 text-right">
                        {fam.balance_owed != null && fam.balance_owed > 0 ? (
                          <span className="text-sm font-bold text-red-400">${fam.balance_owed.toFixed(2)}</span>
                        ) : (
                          <span className="text-sm text-[var(--z-muted)]">$0.00</span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-right">
                        <span className="text-sm text-[var(--z-fg)]">${(fam.lifetime_paid ?? 0).toLocaleString()}</span>
                      </td>
                      <td className="px-5 py-3 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Link href={`/crm/families/${fam.id}`} onClick={e => e.stopPropagation()}
                            className="rounded-lg border border-[var(--z-border)] bg-[var(--z-surface)] px-3 py-1 text-xs font-semibold text-[var(--z-fg)] hover:border-[var(--z-accent)]/40 transition-colors">
                            View
                          </Link>
                          <Link href={`/invoices?family_id=${fam.id}&return=family`} onClick={e => e.stopPropagation()}
                            className="rounded-lg bg-[var(--z-accent)] px-3 py-1 text-xs font-bold text-black hover:opacity-90 transition-opacity">
                            Invoice
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {!loading && sorted.length > 0 && (
          <div className="border-t border-[var(--z-border)] px-6 py-3 flex items-center justify-between text-xs text-[var(--z-muted)]">
            <span>
              Showing {sorted.length} of {families.length} families
              {overdueCount > 0 && <span className="ml-2 text-red-400">{overdueCount} overdue</span>}
            </span>
            <span>Total lifetime: ${families.reduce((s, f) => s + (f.lifetime_paid ?? 0), 0).toLocaleString()}</span>
          </div>
        )}
      </div>
    </PageTransition>
  );
}
