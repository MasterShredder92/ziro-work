/* eslint-disable react-hooks/set-state-in-effect */
"use client";
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useState, useCallback } from "react";
import { PageShell } from "@/components/layouts/PageShell";
import { AgentPageBar } from "@/components/agentOS/AgentPageBar";
const CATEGORIES = ["Rent", "Utilities", "Internet", "Payroll", "Equipment", "Supplies", "Marketing", "Insurance", "Other"];
const LOCATIONS = [
    { id: "f7b52dd5-12ee-437f-9c60-f8adf454ac31", name: "Bellevue" },
    { id: "40c67ffc-91b5-46a9-94bd-6ddffdfb7638", name: "Gretna" },
    { id: "cebd97d4-c241-4de2-8ade-49e5cc0070d5", name: "Elkhorn" },
    { id: "d48229c1-b70a-4d29-893e-5079887dab76", name: "Omaha" },
];
function fmt(cents) {
    return `$${(cents / 100).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}
// Map DB row → Expense type
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function dbRowToExpense(row) {
    var _a, _b, _c, _d, _e, _f, _g;
    return {
        id: row.id,
        label: (_a = row.description) !== null && _a !== void 0 ? _a : "",
        amount: (_b = row.amount_cents) !== null && _b !== void 0 ? _b : 0,
        category: (_c = row.category) !== null && _c !== void 0 ? _c : "Other",
        location_id: (_d = row.location_id) !== null && _d !== void 0 ? _d : null,
        date: (_e = row.effective_date) !== null && _e !== void 0 ? _e : "",
        recurring: (_f = row.is_recurring) !== null && _f !== void 0 ? _f : false,
        frequency: (_g = row.frequency) !== null && _g !== void 0 ? _g : undefined,
        note: undefined,
    };
}
// ─── Expense Form ─────────────────────────────────────────────────────────────
function ExpenseForm({ onAdd, saving }) {
    const [label, setLabel] = useState("");
    const [amount, setAmount] = useState("");
    const [category, setCategory] = useState("Rent");
    const [locationId, setLocationId] = useState(LOCATIONS[0].id);
    const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
    const [recurring, setRecurring] = useState(false);
    const [frequency, setFrequency] = useState("monthly");
    function handleSubmit(e) {
        e.preventDefault();
        const cents = Math.round(parseFloat(amount) * 100);
        if (!label || isNaN(cents) || cents <= 0)
            return;
        onAdd({ label, amount: cents, category, location_id: locationId, date, recurring, frequency: recurring ? frequency : undefined });
        setLabel("");
        setAmount("");
    }
    return (_jsxs("form", { onSubmit: handleSubmit, className: "rounded-xl border border-[#1c1c1e] bg-[#0a0a0c] p-4", children: [_jsx("h3", { className: "mb-4 text-sm font-bold text-white", children: "Add Expense" }), _jsxs("div", { className: "grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3", children: [_jsx("input", { placeholder: "Description (e.g. Rent \u2014 Bellevue)", value: label, onChange: (e) => setLabel(e.target.value), className: "rounded-lg border border-[#1c1c1e] bg-[#111113] px-3 py-2 text-sm text-white placeholder-[#404048] focus:border-[#00ff88]/30 focus:outline-none col-span-full sm:col-span-2", required: true }), _jsx("input", { type: "number", placeholder: "Amount ($)", value: amount, onChange: (e) => setAmount(e.target.value), step: "0.01", min: "0", className: "rounded-lg border border-[#1c1c1e] bg-[#111113] px-3 py-2 text-sm text-white placeholder-[#404048] focus:border-[#00ff88]/30 focus:outline-none", required: true }), _jsx("select", { value: category, onChange: (e) => setCategory(e.target.value), className: "rounded-lg border border-[#1c1c1e] bg-[#111113] px-3 py-2 text-sm text-white focus:outline-none", children: CATEGORIES.map((c) => _jsx("option", { value: c, children: c }, c)) }), _jsx("select", { value: locationId, onChange: (e) => setLocationId(e.target.value), className: "rounded-lg border border-[#1c1c1e] bg-[#111113] px-3 py-2 text-sm text-white focus:outline-none", children: LOCATIONS.map((l) => _jsx("option", { value: l.id, children: l.name }, l.id)) }), _jsx("input", { type: "date", value: date, onChange: (e) => setDate(e.target.value), className: "rounded-lg border border-[#1c1c1e] bg-[#111113] px-3 py-2 text-sm text-white focus:outline-none" }), _jsxs("div", { className: "flex items-center gap-3", children: [_jsxs("label", { className: "flex items-center gap-2 text-sm text-[#909098] cursor-pointer", children: [_jsx("input", { type: "checkbox", checked: recurring, onChange: (e) => setRecurring(e.target.checked), className: "accent-[#00ff88]" }), "Recurring"] }), recurring && (_jsxs("select", { value: frequency, onChange: (e) => setFrequency(e.target.value), className: "rounded-lg border border-[#1c1c1e] bg-[#111113] px-2 py-1 text-xs text-white focus:outline-none", children: [_jsx("option", { value: "weekly", children: "Weekly" }), _jsx("option", { value: "monthly", children: "Monthly" }), _jsx("option", { value: "quarterly", children: "Quarterly" }), _jsx("option", { value: "annual", children: "Annual" })] }))] })] }), _jsx("button", { type: "submit", disabled: saving, className: "mt-4 rounded-lg bg-[#00ff88]/10 px-4 py-2 text-sm font-semibold text-[#00ff88] hover:bg-[#00ff88]/20 transition-colors disabled:opacity-50", children: saving ? "Saving…" : "+ Add Expense" })] }));
}
// ─── Main Component ───────────────────────────────────────────────────────────
export function FinancialsClient() {
    var _a;
    const [revenue, setRevenue] = useState(null);
    const [expenses, setExpenses] = useState([]);
    const [filterLocation, setFilterLocation] = useState("all");
    const [revenueLoading, setRevenueLoading] = useState(true);
    const [expensesLoading, setExpensesLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [editingExpense, setEditingExpense] = useState(null);
    // Current month for expense filter
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    // Load revenue summary — no-store to bypass cache
    useEffect(() => {
        fetch("/api/invoices/billing-summary", { cache: "no-store" })
            .then((r) => r.json())
            .then((res) => {
            var _a, _b;
            setRevenue((_b = (_a = res.data) === null || _a === void 0 ? void 0 : _a.allSchools) !== null && _b !== void 0 ? _b : null);
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
            var _a;
            setExpenses(((_a = res.data) !== null && _a !== void 0 ? _a : []).map(dbRowToExpense));
            setExpensesLoading(false);
        })
            .catch(() => setExpensesLoading(false));
    }, []);
    useEffect(() => { loadExpenses(); }, [loadExpenses]);
    async function addExpense(e) {
        var _a;
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
                    frequency: (_a = e.frequency) !== null && _a !== void 0 ? _a : null,
                }),
            });
            if (res.ok) {
                loadExpenses();
            }
        }
        finally {
            setSaving(false);
        }
    }
    async function removeExpense(id) {
        // Optimistic remove
        setExpenses((prev) => prev.filter((e) => e.id !== id));
        await fetch(`/api/expenses/${id}`, { method: "DELETE" });
    }
    async function saveEditedExpense(updated) {
        var _a;
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
                    frequency: (_a = updated.frequency) !== null && _a !== void 0 ? _a : null,
                }),
            });
            if (res.ok) {
                setEditingExpense(null);
                loadExpenses();
            }
        }
        finally {
            setSaving(false);
        }
    }
    // Filtered expenses
    const filtered = filterLocation === "all" ? expenses : expenses.filter((e) => e.location_id === filterLocation);
    const totalExpenses = filtered.reduce((s, e) => s + e.amount, 0);
    // P&L
    const collectedCents = (_a = revenue === null || revenue === void 0 ? void 0 : revenue.collected) !== null && _a !== void 0 ? _a : 0;
    const teacherPayroll = Math.round(collectedCents * 0.5); // ~50% to teachers
    const otherExpenses = totalExpenses;
    const ownerTakeHome = collectedCents - teacherPayroll - otherExpenses;
    // CSV export
    function exportCSV() {
        const rows = [
            ["Date", "Description", "Category", "Location", "Amount", "Recurring"],
            ...filtered.map((e) => {
                var _a, _b, _c;
                return [
                    e.date,
                    e.label,
                    e.category,
                    (_b = (_a = LOCATIONS.find((l) => l.id === e.location_id)) === null || _a === void 0 ? void 0 : _a.name) !== null && _b !== void 0 ? _b : "All",
                    (e.amount / 100).toFixed(2),
                    e.recurring ? ((_c = e.frequency) !== null && _c !== void 0 ? _c : "yes") : "no",
                ];
            }),
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
    return (_jsxs(PageShell, { title: "Financials", children: [_jsxs("div", { className: "space-y-6", children: [_jsx(AgentPageBar, { agentId: "bub", chatPlaceholder: "Ask Bub about revenue, expenses, or P&L\u2026", pageContext: { page: "financials", collected: collectedCents, teacherPayroll, otherExpenses, ownerTakeHome } }), _jsxs("div", { children: [_jsx("h2", { className: "mb-3 text-xs font-bold uppercase tracking-widest text-[#505055]", children: "Revenue This Month" }), revenueLoading ? (_jsx("div", { className: "grid grid-cols-2 gap-3 sm:grid-cols-5", children: [1, 2, 3, 4, 5].map((i) => _jsx("div", { className: "h-20 animate-pulse rounded-xl bg-white/5" }, i)) })) : revenue ? (_jsx("div", { className: "grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5", children: [
                                    { label: "Collected", value: fmt(revenue.collected), color: "text-[#00ff88]" },
                                    { label: "Total Invoiced", value: fmt(revenue.totalInvoiced), color: "text-white" },
                                    { label: "Outstanding", value: fmt(revenue.outstanding), color: "text-red-500" },
                                    { label: "Next Month Projected", value: fmt(revenue.nextMonthProjected), color: "text-[#0EA5E9]" },
                                    { label: "Scheduled Payments", value: fmt(revenue.scheduled), color: "text-[#909098]" },
                                ].map((m) => (_jsxs("div", { className: "rounded-xl border border-[#1c1c1e] bg-[#0a0a0c] p-4", children: [_jsx("div", { className: `text-xl font-bold ${m.color}`, children: m.value }), _jsx("div", { className: "mt-1 text-xs text-[#505055]", children: m.label })] }, m.label))) })) : (_jsx("div", { className: "text-sm text-[#505055]", children: "Could not load revenue data. Run a Square sync first." }))] }), _jsxs("div", { className: "rounded-xl border border-[#1c1c1e] bg-[#0a0a0c] p-5", children: [_jsx("h2", { className: "mb-4 text-xs font-bold uppercase tracking-widest text-[#505055]", children: "P&L \u2014 Owner Take-Home" }), _jsxs("div", { className: "space-y-2", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("span", { className: "text-sm text-[#909098]", children: "Collected This Month" }), _jsx("span", { className: "text-sm font-semibold text-[#00ff88]", children: fmt(collectedCents) })] }), _jsxs("div", { className: "flex items-center justify-between", children: [_jsx("span", { className: "text-sm text-[#909098]", children: "Teacher Payroll (~50%)" }), _jsxs("span", { className: "text-sm font-semibold text-red-400", children: ["\u2212 ", fmt(teacherPayroll)] })] }), _jsxs("div", { className: "flex items-center justify-between", children: [_jsx("span", { className: "text-sm text-[#909098]", children: "Other Expenses" }), _jsxs("span", { className: "text-sm font-semibold text-red-400", children: ["\u2212 ", fmt(otherExpenses)] })] }), _jsx("div", { className: "my-2 border-t border-[#1c1c1e]" }), _jsxs("div", { className: "flex items-center justify-between", children: [_jsx("span", { className: "text-base font-bold text-white", children: "Owner Take-Home" }), _jsxs("span", { className: `text-xl font-extrabold ${ownerTakeHome >= 0 ? "text-[#00ff88]" : "text-red-400"}`, children: [ownerTakeHome < 0 ? "−" : "", fmt(Math.abs(ownerTakeHome))] })] })] }), _jsx("p", { className: "mt-3 text-xs text-[#404048]", children: "Payroll estimate is 50% of collected revenue. Add all expenses below for an exact figure." })] }), _jsxs("div", { children: [_jsxs("div", { className: "mb-3 flex items-center justify-between gap-3 flex-wrap", children: [_jsx("h2", { className: "text-xs font-bold uppercase tracking-widest text-[#505055]", children: "Expenses" }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsxs("select", { value: filterLocation, onChange: (e) => setFilterLocation(e.target.value), className: "rounded-lg border border-[#1c1c1e] bg-[#111113] px-2 py-1 text-xs text-white focus:outline-none", children: [_jsx("option", { value: "all", children: "All Locations" }), LOCATIONS.map((l) => _jsx("option", { value: l.id, children: l.name }, l.id))] }), _jsx("button", { onClick: exportCSV, className: "rounded-lg border border-[#1c1c1e] px-3 py-1.5 text-xs font-semibold text-[#909098] hover:text-white hover:border-[#2b2b2f] transition-colors", children: "Export CSV" })] })] }), _jsx(ExpenseForm, { onAdd: addExpense, saving: saving }), _jsx("div", { className: "mt-4 space-y-2", children: expensesLoading ? (_jsx("div", { className: "space-y-2", children: [1, 2, 3].map((i) => _jsx("div", { className: "h-14 animate-pulse rounded-lg bg-white/5" }, i)) })) : filtered.length === 0 ? (_jsx("div", { className: "rounded-xl border border-dashed border-[#1c1c1e] p-6 text-center text-sm text-[#505055]", children: "No expenses yet. Add your first expense above." })) : (_jsxs(_Fragment, { children: [filtered.map((e) => {
                                            var _a, _b, _c;
                                            return (_jsxs("div", { className: "flex items-center gap-3 rounded-lg border border-[#1c1c1e] bg-[#0a0a0c] p-3 cursor-pointer hover:border-[#2b2b2f] hover:bg-[#111113] transition-colors group", onClick: () => setEditingExpense(e), children: [_jsxs("div", { className: "flex-1 min-w-0", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("span", { className: "text-sm font-semibold text-white truncate", children: e.label }), e.recurring && (_jsx("span", { className: "rounded-full bg-[#0EA5E9]/10 px-1.5 py-0.5 text-[10px] font-semibold text-[#0EA5E9]", children: (_a = e.frequency) !== null && _a !== void 0 ? _a : "recurring" })), _jsx("span", { className: "ml-auto opacity-0 group-hover:opacity-100 text-[10px] text-[#505055] transition-opacity", children: "Edit" })] }), _jsxs("div", { className: "text-xs text-[#505055]", children: [e.category, " \u00B7 ", (_c = (_b = LOCATIONS.find((l) => l.id === e.location_id)) === null || _b === void 0 ? void 0 : _b.name) !== null && _c !== void 0 ? _c : "All Locations", " \u00B7 ", e.date] })] }), _jsxs("span", { className: "shrink-0 text-sm font-bold text-red-400", children: ["\u2212 ", fmt(e.amount)] }), _jsx("button", { onClick: (ev) => { ev.stopPropagation(); removeExpense(e.id); }, className: "shrink-0 text-[#404048] hover:text-red-400 transition-colors text-sm", children: "\u2715" })] }, e.id));
                                        }), _jsxs("div", { className: "flex items-center justify-between rounded-lg border border-[#1c1c1e] bg-[#111113] p-3", children: [_jsx("span", { className: "text-sm font-bold text-white", children: "Total Expenses" }), _jsxs("span", { className: "text-sm font-bold text-red-400", children: ["\u2212 ", fmt(totalExpenses)] })] })] })) })] })] }), editingExpense && (_jsx(EditExpenseModal, { expense: editingExpense, saving: saving, onSave: saveEditedExpense, onClose: () => setEditingExpense(null) }))] }));
}
// ─── Edit Expense Modal ───────────────────────────────────────────────────────
function EditExpenseModal({ expense, saving, onSave, onClose, }) {
    var _a, _b;
    const [label, setLabel] = useState(expense.label);
    const [amount, setAmount] = useState(String(expense.amount / 100));
    const [category, setCategory] = useState(expense.category);
    const [locationId, setLocationId] = useState((_a = expense.location_id) !== null && _a !== void 0 ? _a : "");
    const [date, setDate] = useState(expense.date);
    const [recurring, setRecurring] = useState(expense.recurring);
    const [frequency, setFrequency] = useState((_b = expense.frequency) !== null && _b !== void 0 ? _b : "monthly");
    function handleSubmit(e) {
        e.preventDefault();
        if (!label.trim() || !amount)
            return;
        onSave(Object.assign(Object.assign({}, expense), { label: label.trim(), amount: Math.round(parseFloat(amount) * 100), category, location_id: locationId || null, date,
            recurring, frequency: recurring ? frequency : undefined }));
    }
    return (_jsxs("div", { className: "fixed inset-0 z-[60] flex items-center justify-center p-4", onClick: onClose, children: [_jsx("div", { className: "absolute inset-0 bg-black/60 backdrop-blur-sm" }), _jsxs("div", { className: "relative w-full max-w-md rounded-2xl border border-[#2b2b2f] bg-[#0f0f12] p-6 shadow-2xl space-y-4", onClick: (ev) => ev.stopPropagation(), children: [_jsx("h3", { className: "text-base font-bold text-white", children: "Edit Expense" }), _jsxs("form", { onSubmit: handleSubmit, className: "space-y-3", children: [_jsxs("div", { className: "space-y-1", children: [_jsx("label", { className: "block text-[10px] font-semibold uppercase tracking-wider text-[#909098]", children: "Label" }), _jsx("input", { type: "text", required: true, value: label, onChange: (e) => setLabel(e.target.value), className: "w-full rounded-xl border border-[#2b2b2f] bg-[#1a1a1e] px-3 py-2 text-sm text-white focus:border-[#00ff88]/50 focus:outline-none" })] }), _jsxs("div", { className: "grid grid-cols-2 gap-3", children: [_jsxs("div", { className: "space-y-1", children: [_jsx("label", { className: "block text-[10px] font-semibold uppercase tracking-wider text-[#909098]", children: "Amount ($)" }), _jsx("input", { type: "number", required: true, min: "0.01", step: "0.01", value: amount, onChange: (e) => setAmount(e.target.value), className: "w-full rounded-xl border border-[#2b2b2f] bg-[#1a1a1e] px-3 py-2 text-sm text-white focus:border-[#00ff88]/50 focus:outline-none" })] }), _jsxs("div", { className: "space-y-1", children: [_jsx("label", { className: "block text-[10px] font-semibold uppercase tracking-wider text-[#909098]", children: "Date" }), _jsx("input", { type: "date", required: true, value: date, onChange: (e) => setDate(e.target.value), className: "w-full rounded-xl border border-[#2b2b2f] bg-[#1a1a1e] px-3 py-2 text-sm text-white focus:border-[#00ff88]/50 focus:outline-none" })] })] }), _jsxs("div", { className: "grid grid-cols-2 gap-3", children: [_jsxs("div", { className: "space-y-1", children: [_jsx("label", { className: "block text-[10px] font-semibold uppercase tracking-wider text-[#909098]", children: "Category" }), _jsx("select", { value: category, onChange: (e) => setCategory(e.target.value), className: "w-full rounded-xl border border-[#2b2b2f] bg-[#1a1a1e] px-3 py-2 text-sm text-white focus:border-[#00ff88]/50 focus:outline-none", children: CATEGORIES.map((c) => _jsx("option", { value: c, children: c }, c)) })] }), _jsxs("div", { className: "space-y-1", children: [_jsx("label", { className: "block text-[10px] font-semibold uppercase tracking-wider text-[#909098]", children: "Location" }), _jsxs("select", { value: locationId, onChange: (e) => setLocationId(e.target.value), className: "w-full rounded-xl border border-[#2b2b2f] bg-[#1a1a1e] px-3 py-2 text-sm text-white focus:border-[#00ff88]/50 focus:outline-none", children: [_jsx("option", { value: "", children: "All Locations" }), LOCATIONS.map((l) => _jsx("option", { value: l.id, children: l.name }, l.id))] })] })] }), _jsxs("label", { className: "flex items-center gap-2 text-sm text-white cursor-pointer", children: [_jsx("input", { type: "checkbox", checked: recurring, onChange: (e) => setRecurring(e.target.checked), className: "accent-[#00ff88]" }), "Recurring"] }), recurring && (_jsxs("select", { value: frequency, onChange: (e) => setFrequency(e.target.value), className: "w-full rounded-xl border border-[#2b2b2f] bg-[#1a1a1e] px-3 py-2 text-sm text-white focus:border-[#00ff88]/50 focus:outline-none", children: [_jsx("option", { value: "weekly", children: "Weekly" }), _jsx("option", { value: "monthly", children: "Monthly" }), _jsx("option", { value: "quarterly", children: "Quarterly" }), _jsx("option", { value: "annual", children: "Annual" })] })), _jsxs("div", { className: "flex gap-2 pt-1", children: [_jsx("button", { type: "button", onClick: onClose, className: "flex-1 rounded-xl border border-[#2b2b2f] bg-[#1a1a1e] px-3 py-2.5 text-sm font-semibold text-[#909098] hover:text-white transition-colors", children: "Cancel" }), _jsx("button", { type: "submit", disabled: saving, className: "flex-1 rounded-xl border border-[#00ff88]/40 bg-[#00ff88]/15 px-3 py-2.5 text-sm font-semibold text-[#00ff88] disabled:opacity-40 hover:bg-[#00ff88]/25 transition-colors", children: saving ? "Saving…" : "Save Changes" })] })] })] })] }));
}
