/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import React, { useEffect, useState, useCallback } from "react";
import { PageShell } from "@/components/layouts/PageShell";

// ─── Types ────────────────────────────────────────────────────────────────────
type Expense = {
  id: string;
  label: string;        // maps to DB description
  amount: number;       // in cents (DB: amount_cents)
  category: string;
  location_id: string | null;
  date: string;         // maps to DB effective_date
  recurring: boolean;   // maps to DB is_recurring
  frequency?: "weekly" | "monthly" | "quarterly" | "annual";
  note?: string;
};

type RevenueSummary = {
  collected: number;
  totalInvoiced: number;
  outstanding: number;
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

// Map DB row → Expense type
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function dbRowToExpense(row: any): Expense {
  return {
    id: row.id,
    label: row.description ?? "",
    amount: row.amount_cents ?? 0,
    category: row.category ?? "Other",
    location_id: row.location_id ?? null,
    date: row.effective_date ?? "",
    recurring: row.is_recurring ?? false,
    frequency: row.frequency ?? undefined,
    note: undefined,
  };
}

// ─── Expense Form ─────────────────────────────────────────────────────────────
function ExpenseForm({ onAdd, saving }: { onAdd: (e: Omit<Expense, "id">) => void; saving: boolean }) {
  const [label, setLabel] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("Rent");
  const [locationId, setLocationId] = useState(LOCATIONS[0].id);
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [recurring, setRecurring] = useState(false);
  const [frequency, setFrequency] = useState<"weekly" | "monthly" | "quarterly" | "annual">("monthly");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const cents = Math.round(parseFloat(amount) * 100);
    if (!label || isNaN(cents) || cents <= 0) return;
    onAdd({ label, amount: cents, category, location_id: locationId, date, recurring, frequency: recurring ? frequency : undefined });
    setLabel(""); setAmount("");
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
      </div>
      <button
        type="submit"
        disabled={saving}
        className="mt-4 rounded-lg bg-[#00ff88]/10 px-4 py-2 text-sm font-semibold text-[#00ff88] hover:bg-[#00ff88]/20 transition-colors disabled:opacity-50"
      >
        {saving ? "Saving…" : "+ Add Expense"}
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
  const [expensesLoading, setExpensesLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  // Current month for expense filter
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  // Load revenue summary — no-store to bypass cache
  useEffect(() => {
    fetch("/api/invoices/billing-summary", { cache: "no-store" })
      .then((r) => r.json())
      .then((res) => {
        setRevenue(res.data?.allSchools ?? null);
        setRevenueLoading(false);
      })
      .catch(() => setRevenueLoading(false));
  }, []);

  // Load expenses from DB
  const loadExpenses = useCallback(() => {
    setExpensesLoading(true);
    fetch(`/api/expenses`, { cache: "no-store" })
      .then((r) => r.json())
      .then((res) => {
        setExpenses((res.data ?? []).map(dbRowToExpense));
        setExpensesLoading(false);
      })
      .catch(() => setExpensesLoading(false));
  }, []);

  useEffect(() => { loadExpenses(); }, [loadExpenses]);

  async function addExpense(e: Omit<Expense, "id">) {
    setSaving(true);
    try {
      const res = await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          label: e.label,
          amount_cents: e.amount,
          category: e.category,
          location_id: e.location_id,
          date: e.date,
          recurring: e.recurring,
          frequency: e.frequency ?? null,
        }),
      });
      if (res.ok) { loadExpenses(); }
    } finally {
      setSaving(false);
    }
  }

  async function removeExpense(id: string) {
    // Optimistic remove
    setExpenses((prev) => prev.filter((e) => e.id !== id));
    await fetch(`/api/expenses/${id}`, { method: "DELETE" });
  }

  async function saveEditedExpense(updated: Expense) {
    setSaving(true);
    try {
      const res = await fetch(`/api/expenses/${updated.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          label: updated.label,
          amount_cents: updated.amount,
          category: updated.category,
          location_id: updated.location_id,
          date: updated.date,
          recurring: updated.recurring,
          frequency: updated.frequency ?? null,
        }),
      });
      if (res.ok) {
        setEditingExpense(null);
        loadExpenses();
      }
    } finally {
      setSaving(false);
    }
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
      ["Date", "Description", "Category", "Location", "Amount", "Recurring"],
      ...filtered.map((e) => [
        e.date,
        e.label,
        e.category,
        LOCATIONS.find((l) => l.id === e.location_id)?.name ?? "All",
        (e.amount / 100).toFixed(2),
        e.recurring ? (e.frequency ?? "yes") : "no",
      ]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `expenses-${currentMonth}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <PageShell title="Financials">
      <div className="space-y-6">

        {/* Bub agent bar */}

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
                { label: "Outstanding", value: fmt(revenue.outstanding), color: "text-red-500" },
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
            <div className="text-sm text-[#505055]">Could not load revenue data. Run a Square sync first.</div>
          )}
        </div>

        {/* P&L Summary */}
        <div className="rounded-xl border border-[#1c1c1e] bg-[#0a0a0c] p-5">
          <h2 className="mb-4 text-xs font-bold uppercase tracking-widest text-[#505055]">P&amp;L — Owner Take-Home</h2>
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
            Payroll estimate is 50% of collected revenue. Add all expenses below for an exact figure.
          </p>
        </div>

        {/* Expense Tracker */}
        <div>
          <div className="mb-3 flex items-center justify-between gap-3 flex-wrap">
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

          <ExpenseForm onAdd={addExpense} saving={saving} />

          <div className="mt-4 space-y-2">
            {expensesLoading ? (
              <div className="space-y-2">
                {[1,2,3].map((i) => <div key={i} className="h-14 animate-pulse rounded-lg bg-white/5" />)}
              </div>
            ) : filtered.length === 0 ? (
              <div className="rounded-xl border border-dashed border-[#1c1c1e] p-6 text-center text-sm text-[#505055]">
                No expenses yet. Add your first expense above.
              </div>
            ) : (
              <>
                {filtered.map((e) => (
                  <div
                    key={e.id}
                    className="flex items-center gap-3 rounded-lg border border-[#1c1c1e] bg-[#0a0a0c] p-3 cursor-pointer hover:border-[#2b2b2f] hover:bg-[#111113] transition-colors group"
                    onClick={() => setEditingExpense(e)}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-white truncate">{e.label}</span>
                        {e.recurring && (
                          <span className="rounded-full bg-[#0EA5E9]/10 px-1.5 py-0.5 text-[10px] font-semibold text-[#0EA5E9]">
                            {e.frequency ?? "recurring"}
                          </span>
                        )}
                        <span className="ml-auto opacity-0 group-hover:opacity-100 text-[10px] text-[#505055] transition-opacity">Edit</span>
                      </div>
                      <div className="text-xs text-[#505055]">
                        {e.category} · {LOCATIONS.find((l) => l.id === e.location_id)?.name ?? "All Locations"} · {e.date}
                      </div>
                    </div>
                    <span className="shrink-0 text-sm font-bold text-red-400">− {fmt(e.amount)}</span>
                    <button
                      onClick={(ev) => { ev.stopPropagation(); removeExpense(e.id); }}
                      className="shrink-0 text-[#404048] hover:text-red-400 transition-colors text-sm"
                    >✕</button>
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

      {/* ── Edit Expense Modal ── */}
      {editingExpense && (
        <EditExpenseModal
          expense={editingExpense}
          saving={saving}
          onSave={saveEditedExpense}
          onClose={() => setEditingExpense(null)}
        />
      )}
    </PageShell>
  );
}

// ─── Edit Expense Modal ───────────────────────────────────────────────────────
function EditExpenseModal({
  expense,
  saving,
  onSave,
  onClose,
}: {
  expense: Expense;
  saving: boolean;
  onSave: (e: Expense) => void;
  onClose: () => void;
}) {
  const [label, setLabel] = useState(expense.label);
  const [amount, setAmount] = useState(String(expense.amount / 100));
  const [category, setCategory] = useState(expense.category);
  const [locationId, setLocationId] = useState(expense.location_id ?? "");
  const [date, setDate] = useState(expense.date);
  const [recurring, setRecurring] = useState(expense.recurring);
  const [frequency, setFrequency] = useState<"weekly" | "monthly" | "quarterly" | "annual">(expense.frequency ?? "monthly");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!label.trim() || !amount) return;
    onSave({
      ...expense,
      label: label.trim(),
      amount: Math.round(parseFloat(amount) * 100),
      category,
      location_id: locationId || null,
      date,
      recurring,
      frequency: recurring ? frequency : undefined,
    });
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-md rounded-2xl border border-[#2b2b2f] bg-[#0f0f12] p-6 shadow-2xl space-y-4"
        onClick={(ev) => ev.stopPropagation()}
      >
        <h3 className="text-base font-bold text-white">Edit Expense</h3>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1">
            <label className="block text-[10px] font-semibold uppercase tracking-wider text-[#909098]">Label</label>
            <input
              type="text"
              required
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              className="w-full rounded-xl border border-[#2b2b2f] bg-[#1a1a1e] px-3 py-2 text-sm text-white focus:border-[#00ff88]/50 focus:outline-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="block text-[10px] font-semibold uppercase tracking-wider text-[#909098]">Amount ($)</label>
              <input
                type="number"
                required
                min="0.01"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full rounded-xl border border-[#2b2b2f] bg-[#1a1a1e] px-3 py-2 text-sm text-white focus:border-[#00ff88]/50 focus:outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-[10px] font-semibold uppercase tracking-wider text-[#909098]">Date</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full rounded-xl border border-[#2b2b2f] bg-[#1a1a1e] px-3 py-2 text-sm text-white focus:border-[#00ff88]/50 focus:outline-none"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="block text-[10px] font-semibold uppercase tracking-wider text-[#909098]">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-xl border border-[#2b2b2f] bg-[#1a1a1e] px-3 py-2 text-sm text-white focus:border-[#00ff88]/50 focus:outline-none"
              >
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="block text-[10px] font-semibold uppercase tracking-wider text-[#909098]">Location</label>
              <select
                value={locationId}
                onChange={(e) => setLocationId(e.target.value)}
                className="w-full rounded-xl border border-[#2b2b2f] bg-[#1a1a1e] px-3 py-2 text-sm text-white focus:border-[#00ff88]/50 focus:outline-none"
              >
                <option value="">All Locations</option>
                {LOCATIONS.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
              </select>
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm text-white cursor-pointer">
            <input type="checkbox" checked={recurring} onChange={(e) => setRecurring(e.target.checked)} className="accent-[#00ff88]" />
            Recurring
          </label>
          {recurring && (
            <select
              value={frequency}
              onChange={(e) => setFrequency(e.target.value as typeof frequency)}
              className="w-full rounded-xl border border-[#2b2b2f] bg-[#1a1a1e] px-3 py-2 text-sm text-white focus:border-[#00ff88]/50 focus:outline-none"
            >
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="quarterly">Quarterly</option>
              <option value="annual">Annual</option>
            </select>
          )}
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-[#2b2b2f] bg-[#1a1a1e] px-3 py-2.5 text-sm font-semibold text-[#909098] hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 rounded-xl border border-[#00ff88]/40 bg-[#00ff88]/15 px-3 py-2.5 text-sm font-semibold text-[#00ff88] disabled:opacity-40 hover:bg-[#00ff88]/25 transition-colors"
            >
              {saving ? "Saving…" : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
