"use client";

import { useEffect, useState, useCallback } from "react";
import { PageShell } from "@/components/layouts/PageShell";

// ─── Types ────────────────────────────────────────────────────────────────────
type Expense = {
  id: string;
  label: string;
  amount: number; // in cents
  category: string;
  location_id: string;
  date: string;
  recurring: boolean;
  frequency?: "weekly" | "monthly" | "quarterly" | "annual";
  note?: string;
};

type RevenueSummary = {
  collected: number;
  totalInvoiced: number;
  discounted: number;
  nextMonthProjected: number;
  scheduled: number;
};

const CATEGORIES = ["Rent", "Utilities", "Internet", "Payroll", "Equipment", "Supplies", "Marketing", "Insurance", "Other"];
const LOCATIONS = [
  { id: "f7b52dd5-12ee-437f-9c60-f8adf454ac31", name: "Bellevue" },
  { id: "40c67ffc-91b5-46a9-94bd-6ddffdfb7638", name: "Gretna" },
  { id: "cebd97d4-c241-4de2-8ade-49e5cc0070d5", name: "Elkhorn" },
  { id: "d48229c1-b70a-4d29-893e-5079887dab76", name: "Omaha" },
];

function fmt(cents: number) {
  return `$${(cents / 100).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}
function fmtInput(cents: number) {
  return (cents / 100).toFixed(2);
}

// ─── Expense Form ─────────────────────────────────────────────────────────────
function ExpenseForm({ onAdd }: { onAdd: (e: Omit<Expense, "id">) => void }) {
  const [label, setLabel] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("Rent");
  const [locationId, setLocationId] = useState(LOCATIONS[0].id);
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [recurring, setRecurring] = useState(false);
  const [frequency, setFrequency] = useState<"weekly" | "monthly" | "quarterly" | "annual">("monthly");
  const [note, setNote] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const cents = Math.round(parseFloat(amount) * 100);
    if (!label || isNaN(cents) || cents <= 0) return;
    onAdd({ label, amount: cents, category, location_id: locationId, date, recurring, frequency: recurring ? frequency : undefined, note: note || undefined });
    setLabel(""); setAmount(""); setNote("");
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-[#1c1c1e] bg-[#0a0a0c] p-4">
      <h3 className="mb-4 text-sm font-bold text-white">Add Expense</h3>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <input
          placeholder="Description (e.g. Rent — Bellevue)"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          className="rounded-lg border border-[#1c1c1e] bg-[#111113] px-3 py-2 text-sm text-white placeholder-[#404048] focus:border-[#00ff88]/30 focus:outline-none col-span-full sm:col-span-2"
          required
        />
        <input
          type="number"
          placeholder="Amount ($)"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          step="0.01"
          min="0"
          className="rounded-lg border border-[#1c1c1e] bg-[#111113] px-3 py-2 text-sm text-white placeholder-[#404048] focus:border-[#00ff88]/30 focus:outline-none"
          required
        />
        <select value={category} onChange={(e) => setCategory(e.target.value)} className="rounded-lg border border-[#1c1c1e] bg-[#111113] px-3 py-2 text-sm text-white focus:outline-none">
          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={locationId} onChange={(e) => setLocationId(e.target.value)} className="rounded-lg border border-[#1c1c1e] bg-[#111113] px-3 py-2 text-sm text-white focus:outline-none">
          {LOCATIONS.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
        </select>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="rounded-lg border border-[#1c1c1e] bg-[#111113] px-3 py-2 text-sm text-white focus:outline-none" />
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-[#909098] cursor-pointer">
            <input type="checkbox" checked={recurring} onChange={(e) => setRecurring(e.target.checked)} className="accent-[#00ff88]" />
            Recurring
          </label>
          {recurring && (
            <select value={frequency} onChange={(e) => setFrequency(e.target.value as typeof frequency)} className="rounded-lg border border-[#1c1c1e] bg-[#111113] px-2 py-1 text-xs text-white focus:outline-none">
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="quarterly">Quarterly</option>
              <option value="annual">Annual</option>
            </select>
          )}
        </div>
        <input
          placeholder="Note (optional)"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="rounded-lg border border-[#1c1c1e] bg-[#111113] px-3 py-2 text-sm text-white placeholder-[#404048] focus:border-[#00ff88]/30 focus:outline-none sm:col-span-2"
        />
      </div>
      <button type="submit" className="mt-4 rounded-lg bg-[#00ff88]/10 px-4 py-2 text-sm font-semibold text-[#00ff88] hover:bg-[#00ff88]/20 transition-colors">
        + Add Expense
      </button>
    </form>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export function FinancialsClient() {
  const [revenue, setRevenue] = useState<RevenueSummary | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [filterLocation, setFilterLocation] = useState("all");
  const [revenueLoading, setRevenueLoading] = useState(true);

  // Load revenue summary
  useEffect(() => {
    fetch("/api/invoices/billing-summary")
      .then((r) => r.json())
      .then((res) => {
        setRevenue(res.data?.allSchools ?? null);
        setRevenueLoading(false);
      })
      .catch(() => setRevenueLoading(false));
  }, []);

  // Load expenses from localStorage (until DB table is wired)
  useEffect(() => {
    try {
      const stored = localStorage.getItem("zw_expenses");
      if (stored) setExpenses(JSON.parse(stored));
    } catch {}
  }, []);

  const saveExpenses = useCallback((updated: Expense[]) => {
    setExpenses(updated);
    try { localStorage.setItem("zw_expenses", JSON.stringify(updated)); } catch {}
  }, []);

  function addExpense(e: Omit<Expense, "id">) {
    saveExpenses([...expenses, { ...e, id: crypto.randomUUID() }]);
  }

  function removeExpense(id: string) {
    saveExpenses(expenses.filter((e) => e.id !== id));
  }

  // Filtered expenses
  const filtered = filterLocation === "all" ? expenses : expenses.filter((e) => e.location_id === filterLocation);
  const totalExpenses = filtered.reduce((s, e) => s + e.amount, 0);

  // P&L
  const collectedCents = revenue?.collected ?? 0;
  const teacherPayroll = Math.round(collectedCents * 0.5); // ~50% to teachers
  const otherExpenses = totalExpenses;
  const ownerTakeHome = collectedCents - teacherPayroll - otherExpenses;

  // CSV export
  function exportCSV() {
    const rows = [
      ["Date", "Description", "Category", "Location", "Amount", "Recurring", "Note"],
      ...filtered.map((e) => [
        e.date,
        e.label,
        e.category,
        LOCATIONS.find((l) => l.id === e.location_id)?.name ?? e.location_id,
        (e.amount / 100).toFixed(2),
        e.recurring ? (e.frequency ?? "yes") : "no",
        e.note ?? "",
      ]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `expenses-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <PageShell title="Financials">
      <div className="space-y-6">

        {/* Revenue Summary */}
        <div>
          <h2 className="mb-3 text-xs font-bold uppercase tracking-widest text-[#505055]">Revenue This Month</h2>
          {revenueLoading ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
              {[1,2,3,4,5].map((i) => <div key={i} className="h-20 animate-pulse rounded-xl bg-white/5" />)}
            </div>
          ) : revenue ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              {[
                { label: "Collected", value: fmt(revenue.collected), color: "text-[#00ff88]" },
                { label: "Total Invoiced", value: fmt(revenue.totalInvoiced), color: "text-white" },
                { label: "Discounted", value: fmt(revenue.discounted), color: "text-amber-400" },
                { label: "Next Month Projected", value: fmt(revenue.nextMonthProjected), color: "text-[#0EA5E9]" },
                { label: "Scheduled Payments", value: fmt(revenue.scheduled), color: "text-[#909098]" },
              ].map((m) => (
                <div key={m.label} className="rounded-xl border border-[#1c1c1e] bg-[#0a0a0c] p-4">
                  <div className={`text-xl font-bold ${m.color}`}>{m.value}</div>
                  <div className="mt-1 text-xs text-[#505055]">{m.label}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-sm text-[#505055]">Could not load revenue data.</div>
          )}
        </div>

        {/* P&L Summary */}
        <div className="rounded-xl border border-[#1c1c1e] bg-[#0a0a0c] p-5">
          <h2 className="mb-4 text-xs font-bold uppercase tracking-widest text-[#505055]">P&L — Owner Take-Home</h2>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-[#909098]">Collected This Month</span>
              <span className="text-sm font-semibold text-[#00ff88]">{fmt(collectedCents)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-[#909098]">Teacher Payroll (~50%)</span>
              <span className="text-sm font-semibold text-red-400">− {fmt(teacherPayroll)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-[#909098]">Other Expenses</span>
              <span className="text-sm font-semibold text-red-400">− {fmt(otherExpenses)}</span>
            </div>
            <div className="my-2 border-t border-[#1c1c1e]" />
            <div className="flex items-center justify-between">
              <span className="text-base font-bold text-white">Owner Take-Home</span>
              <span className={`text-xl font-extrabold ${ownerTakeHome >= 0 ? "text-[#00ff88]" : "text-red-400"}`}>
                {ownerTakeHome < 0 ? "−" : ""}{fmt(Math.abs(ownerTakeHome))}
              </span>
            </div>
          </div>
          <p className="mt-3 text-xs text-[#404048]">
            Payroll estimate is 50% of collected revenue. Connect Square and add all expenses for an exact figure.
          </p>
        </div>

        {/* Bank Connection Stub */}
        <div className="rounded-xl border border-dashed border-[#2b2b2f] bg-[#0a0a0c] p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#1c1c1e] text-lg">🏦</div>
            <div>
              <div className="text-sm font-bold text-white">Connect Bank Account</div>
              <div className="text-xs text-[#505055]">Auto-import transactions via Plaid — coming soon. Add your Plaid API key in Settings → Integrations to activate.</div>
            </div>
            <button
              disabled
              className="ml-auto shrink-0 rounded-lg border border-[#2b2b2f] px-4 py-2 text-xs font-semibold text-[#505055] cursor-not-allowed"
            >
              Connect Plaid
            </button>
          </div>
        </div>

        {/* Expense Tracker */}
        <div>
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="text-xs font-bold uppercase tracking-widest text-[#505055]">Expenses</h2>
            <div className="flex items-center gap-2">
              <select
                value={filterLocation}
                onChange={(e) => setFilterLocation(e.target.value)}
                className="rounded-lg border border-[#1c1c1e] bg-[#111113] px-2 py-1 text-xs text-white focus:outline-none"
              >
                <option value="all">All Locations</option>
                {LOCATIONS.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
              </select>
              <button
                onClick={exportCSV}
                className="rounded-lg border border-[#1c1c1e] px-3 py-1.5 text-xs font-semibold text-[#909098] hover:text-white hover:border-[#2b2b2f] transition-colors"
              >
                Export CSV
              </button>
            </div>
          </div>

          <ExpenseForm onAdd={addExpense} />

          <div className="mt-4 space-y-2">
            {filtered.length === 0 ? (
              <div className="rounded-xl border border-dashed border-[#1c1c1e] p-6 text-center text-sm text-[#505055]">
                No expenses yet. Add your first expense above.
              </div>
            ) : (
              <>
                {filtered.map((e) => (
                  <div key={e.id} className="flex items-center gap-3 rounded-lg border border-[#1c1c1e] bg-[#0a0a0c] p-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-white truncate">{e.label}</span>
                        {e.recurring && (
                          <span className="rounded-full bg-[#0EA5E9]/10 px-1.5 py-0.5 text-[10px] font-semibold text-[#0EA5E9]">
                            {e.frequency ?? "recurring"}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-[#505055]">
                        {e.category} · {LOCATIONS.find((l) => l.id === e.location_id)?.name ?? "—"} · {e.date}
                        {e.note ? ` · ${e.note}` : ""}
                      </div>
                    </div>
                    <span className="shrink-0 text-sm font-bold text-red-400">− {fmt(e.amount)}</span>
                    <button onClick={() => removeExpense(e.id)} className="shrink-0 text-[#404048] hover:text-red-400 transition-colors text-sm">✕</button>
                  </div>
                ))}
                <div className="flex items-center justify-between rounded-lg border border-[#1c1c1e] bg-[#111113] p-3">
                  <span className="text-sm font-bold text-white">Total Expenses</span>
                  <span className="text-sm font-bold text-red-400">− {fmt(totalExpenses)}</span>
                </div>
              </>
            )}
          </div>
        </div>

      </div>
    </PageShell>
  );
}
