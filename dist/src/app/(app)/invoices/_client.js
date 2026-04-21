"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useState, useCallback } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import Link from "next/link";
import { PageShell } from "@/components/layouts/PageShell";
import { BillingSummaryBar } from "@/components/billing/BillingSummaryBar";
import { AgentPageBar } from "@/components/agentOS/AgentPageBar";
// ─── Location config ──────────────────────────────────────────────────────────
const LOCATIONS = [
    { id: "f7b52dd5-12ee-437f-9c60-f8adf454ac31", name: "Bellevue", color: "#7C3AED" },
    { id: "40c67ffc-91b5-46a9-94bd-6ddffdfb7638", name: "Gretna", color: "#16A34A" },
    { id: "cebd97d4-c241-4de2-8ade-49e5cc0070d5", name: "Elkhorn", color: "#0EA5E9" },
    { id: "d48229c1-b70a-4d29-893e-5079887dab76", name: "Omaha", color: "#DC2626" },
];
const LOCATION_MAP = Object.fromEntries(LOCATIONS.map((l) => [l.id, { name: l.name, color: l.color }]));
// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatCents(cents) {
    if (cents == null || isNaN(cents))
        return "—";
    return `$${(cents / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
function formatDate(dateStr) {
    if (!dateStr)
        return "—";
    try {
        return new Date(dateStr).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
        });
    }
    catch (_a) {
        return dateStr;
    }
}
function statusBadge(status) {
    const s = (status !== null && status !== void 0 ? status : "").toUpperCase();
    switch (s) {
        case "PAID":
            return { label: "Paid", bg: "rgba(34,197,94,0.15)", color: "#22C55E" };
        case "UNPAID":
            return { label: "Unpaid", bg: "rgba(239,68,68,0.15)", color: "#EF4444" };
        case "PARTIALLY_PAID":
            return { label: "Partial", bg: "rgba(245,158,11,0.15)", color: "#F59E0B" };
        case "SCHEDULED":
            return { label: "Scheduled", bg: "rgba(14,165,233,0.15)", color: "#0EA5E9" };
        case "DRAFT":
            return { label: "Draft", bg: "rgba(96,96,104,0.15)", color: "#909098" };
        case "CANCELLED":
        case "CANCELED":
            return { label: "Cancelled", bg: "rgba(96,96,104,0.15)", color: "#606068" };
        default:
            return { label: s || "Unknown", bg: "rgba(96,96,104,0.15)", color: "#909098" };
    }
}
function isOverdue(invoice) {
    var _a;
    if (!invoice.due_date)
        return false;
    if (((_a = invoice.status) !== null && _a !== void 0 ? _a : "").toUpperCase() === "PAID")
        return false;
    return new Date(invoice.due_date) < new Date();
}
// ─── Square Sync Button ─────────────────────────────────────────────────────
function SquareSyncButton() {
    const [syncing, setSyncing] = useState(false);
    const [result, setResult] = useState(null);
    const router = useRouter();
    async function handleSync() {
        var _a, _b, _c;
        setSyncing(true);
        setResult(null);
        try {
            const res = await fetch("/api/integrations/square/sync", { method: "POST" });
            const j = await res.json().catch(() => ({}));
            if (res.ok) {
                setResult((_a = j.message) !== null && _a !== void 0 ? _a : "Sync complete");
                router.refresh();
            }
            else {
                setResult((_c = (_b = j.error) !== null && _b !== void 0 ? _b : j.message) !== null && _c !== void 0 ? _c : `Sync failed (${res.status})`);
            }
        }
        catch (_d) {
            setResult("Sync failed — check connection");
        }
        finally {
            setSyncing(false);
            setTimeout(() => setResult(null), 4000);
        }
    }
    return (_jsxs("div", { className: "flex flex-col items-end gap-1 shrink-0", children: [_jsxs("button", { onClick: handleSync, disabled: syncing, className: "flex h-full items-center gap-2 rounded-xl border border-[var(--z-border)] bg-[var(--z-surface)] px-4 text-sm font-semibold text-[var(--z-muted)] hover:text-[var(--z-fg)] hover:border-[#00ff88]/30 disabled:opacity-50 transition-colors", children: [_jsx("span", { className: syncing ? "animate-spin" : "", children: "\u27F3" }), syncing ? "Syncing…" : "Sync Square"] }), result && _jsx("div", { className: "text-[10px] text-[var(--z-muted)]", children: result })] }));
}
// ─── Main Component ───────────────────────────────────────────────────────────
export function InvoicesClient({ invoices, totalCount, page, pageSize, paidTotal, unpaidTotal, overdueCount, initialStatus, initialLocationId, initialSearch, initialMonthOffset, viewLabel, billingMetrics, }) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [search, setSearch] = useState(initialSearch);
    const [status, setStatus] = useState(initialStatus);
    const [locationId, setLocationId] = useState(initialLocationId);
    const [monthOffset, setMonthOffset] = useState(initialMonthOffset);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const totalPages = Math.ceil(totalCount / pageSize);
    const navigate = useCallback((updates) => {
        const params = new URLSearchParams(searchParams.toString());
        for (const [k, v] of Object.entries(updates)) {
            if (v !== undefined && v !== "")
                params.set(k, v);
            else
                params.delete(k);
        }
        params.delete("page");
        router.push(`${pathname}?${params.toString()}`);
    }, [router, pathname, searchParams]);
    const handleSearch = (e) => {
        e.preventDefault();
        navigate({ search, status, location_id: locationId, month_offset: String(monthOffset) });
    };
    const handleStatusChange = (s) => {
        setStatus(s);
        navigate({ search, status: s, location_id: locationId, month_offset: String(monthOffset) });
    };
    const handleLocationChange = (id) => {
        setLocationId(id);
        navigate({ search, status, location_id: id, month_offset: String(monthOffset) });
    };
    const handleMonthChange = (offset) => {
        setMonthOffset(offset);
        navigate({ search, status, location_id: locationId, month_offset: String(offset) });
    };
    const handlePageChange = (p) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set("page", String(p));
        router.push(`${pathname}?${params.toString()}`);
    };
    return (_jsxs(PageShell, { title: "Invoices", children: [_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "flex items-stretch gap-3", children: [_jsx("div", { className: "flex-1", children: _jsx(AgentPageBar, { agentId: "bub", chatPlaceholder: "Ask Bub about invoices, payments, or revenue\u2026", pageContext: { page: "invoices", totalCount, paidTotal, unpaidTotal, overdueCount } }) }), _jsx(SquareSyncButton, {})] }), billingMetrics && _jsx(BillingSummaryBar, { metrics: billingMetrics }), _jsxs("div", { className: "grid grid-cols-2 gap-3 sm:grid-cols-4", children: [_jsxs("div", { className: "rounded-xl border border-[var(--z-border)] bg-[var(--z-surface)] p-4", children: [_jsx("div", { className: "text-2xl font-extrabold text-[#22C55E]", children: formatCents(paidTotal) }), _jsx("div", { className: "text-xs text-[var(--z-muted)]", children: "Total collected" })] }), _jsxs("div", { className: "rounded-xl border border-[var(--z-border)] bg-[var(--z-surface)] p-4", children: [_jsx("div", { className: "text-2xl font-extrabold text-[#EF4444]", children: formatCents(unpaidTotal) }), _jsx("div", { className: "text-xs text-[var(--z-muted)]", children: "Outstanding" })] }), _jsxs("div", { className: "rounded-xl border border-[var(--z-border)] bg-[var(--z-surface)] p-4", children: [_jsx("div", { className: "text-2xl font-extrabold text-[#F59E0B]", children: overdueCount }), _jsx("div", { className: "text-xs text-[var(--z-muted)]", children: "Overdue invoices" })] }), _jsxs("div", { className: "rounded-xl border border-[var(--z-border)] bg-[var(--z-surface)] p-4", children: [_jsx("div", { className: "text-2xl font-extrabold text-[var(--z-fg)]", children: totalCount.toLocaleString() }), _jsx("div", { className: "text-xs text-[var(--z-muted)]", children: "Total invoices" })] })] }), _jsxs("div", { className: "flex flex-wrap items-center justify-between gap-3", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("button", { onClick: () => handleMonthChange(monthOffset - 1), className: "rounded-lg border border-[var(--z-border)] bg-[var(--z-surface)] px-3 py-1.5 text-sm text-[var(--z-muted)] hover:text-[var(--z-fg)] transition-colors", children: "\u2190" }), _jsx("span", { className: "min-w-[160px] text-center text-sm font-semibold text-[var(--z-fg)]", children: viewLabel }), _jsx("button", { onClick: () => handleMonthChange(monthOffset + 1), disabled: monthOffset >= 1, className: "rounded-lg border border-[var(--z-border)] bg-[var(--z-surface)] px-3 py-1.5 text-sm text-[var(--z-muted)] hover:text-[var(--z-fg)] disabled:opacity-40 transition-colors", children: "\u2192" }), monthOffset !== 0 && (_jsx("button", { onClick: () => handleMonthChange(0), className: "rounded-lg border border-[var(--z-border)] bg-[var(--z-surface)] px-3 py-1.5 text-xs text-[var(--z-muted)] hover:text-[var(--z-fg)] transition-colors", children: "Today" }))] }), _jsx("button", { onClick: () => setShowCreateModal(true), className: "rounded-lg bg-[var(--z-accent)] px-4 py-1.5 text-sm font-semibold text-[var(--z-on-accent)] hover:opacity-90 transition-opacity", children: "+ Create Invoice" })] }), _jsxs("div", { className: "flex flex-wrap items-center gap-3", children: [_jsxs("form", { onSubmit: handleSearch, className: "flex w-full gap-2 sm:w-auto", children: [_jsx("input", { type: "search", placeholder: "Search name, email, invoice #\u2026", value: search, onChange: (e) => setSearch(e.target.value), className: "h-9 w-full rounded-lg border border-[var(--z-border)] bg-[var(--z-surface)] px-3 text-sm text-[var(--z-fg)] placeholder:text-[var(--z-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--z-accent)] sm:w-64" }), _jsx("button", { type: "submit", className: "h-9 rounded-lg border border-[var(--z-border)] bg-[var(--z-surface)] px-3 text-sm font-semibold text-[var(--z-muted)] hover:text-[var(--z-fg)] transition-colors", children: "Search" })] }), _jsx("div", { className: "flex rounded-lg border border-[var(--z-border)] overflow-hidden text-sm", children: ["all", "unpaid", "paid", "partially_paid"].map((s) => (_jsx("button", { onClick: () => handleStatusChange(s), className: "px-3 py-1.5 capitalize transition-colors", style: {
                                        background: status === s ? "var(--z-accent)" : "var(--z-surface)",
                                        color: status === s ? "var(--z-on-accent)" : "var(--z-muted)",
                                        fontWeight: status === s ? 700 : 400,
                                    }, children: s === "partially_paid" ? "Partial" : s }, s))) }), _jsxs("div", { className: "flex rounded-lg border border-[var(--z-border)] overflow-hidden text-sm", children: [_jsx("button", { onClick: () => handleLocationChange(""), className: "px-3 py-1.5 transition-colors", style: {
                                            background: !locationId ? "var(--z-accent)" : "var(--z-surface)",
                                            color: !locationId ? "var(--z-on-accent)" : "var(--z-muted)",
                                            fontWeight: !locationId ? 700 : 400,
                                        }, children: "All" }), LOCATIONS.map((loc) => (_jsx("button", { onClick: () => handleLocationChange(loc.id), className: "px-3 py-1.5 transition-colors", style: {
                                            background: locationId === loc.id ? loc.color : "var(--z-surface)",
                                            color: locationId === loc.id ? "#fff" : "var(--z-muted)",
                                            fontWeight: locationId === loc.id ? 700 : 400,
                                        }, children: loc.name }, loc.id)))] }), _jsxs("span", { className: "ml-auto text-sm text-[var(--z-muted)]", children: [totalCount.toLocaleString(), " invoices"] })] }), _jsxs("div", { className: "hidden sm:block rounded-xl border border-[var(--z-border)] overflow-hidden", children: [_jsxs("div", { className: "grid px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-[var(--z-muted)]", style: {
                                    gridTemplateColumns: "1fr 100px 90px 100px 110px 100px 90px",
                                    background: "var(--z-surface)",
                                    borderBottom: "1px solid var(--z-border)",
                                }, children: [_jsx("div", { children: "Customer" }), _jsx("div", { children: "Invoice #" }), _jsx("div", { children: "Studio" }), _jsx("div", { children: "Amount" }), _jsx("div", { children: "Due" }), _jsx("div", { children: "Paid" }), _jsx("div", { children: "Status" })] }), invoices.length === 0 ? (_jsx("div", { className: "px-6 py-12 text-center text-sm text-[var(--z-muted)]", children: "No invoices match your filters." })) : (invoices.map((inv) => {
                                const badge = statusBadge(inv.status);
                                const overdue = isOverdue(inv);
                                const locInfo = inv.location_id ? LOCATION_MAP[inv.location_id] : null;
                                return (_jsxs("div", { className: "grid items-center border-b px-4 py-3 text-sm transition-colors hover:bg-white/[0.02]", style: {
                                        gridTemplateColumns: "1fr 100px 90px 100px 110px 100px 90px",
                                        borderColor: "var(--z-border)",
                                    }, children: [_jsxs("div", { className: "min-w-0", children: [_jsx("div", { className: "truncate font-semibold text-[var(--z-fg)]", children: inv.customer_name || "—" }), inv.customer_email && (_jsx("div", { className: "truncate text-xs text-[var(--z-muted)]", children: inv.customer_email })), inv.family_id && (_jsx(Link, { href: `/crm/families/${inv.family_id}`, className: "text-[10px] hover:underline", style: { color: "var(--z-accent)" }, children: "View family \u2192" }))] }), _jsx("div", { className: "truncate text-xs text-[var(--z-muted)]", children: inv.invoice_number || "—" }), _jsx("div", { children: locInfo ? (_jsx("span", { className: "rounded-full px-2 py-0.5 text-[10px] font-bold", style: {
                                                    background: `${locInfo.color}22`,
                                                    color: locInfo.color,
                                                }, children: locInfo.name })) : (_jsx("span", { className: "text-xs text-[var(--z-muted)]", children: "\u2014" })) }), _jsx("div", { className: "font-semibold text-[var(--z-fg)]", children: formatCents(inv.amount_cents) }), _jsxs("div", { className: "text-xs", style: { color: overdue ? "#EF4444" : "var(--z-muted)" }, children: [formatDate(inv.due_date), overdue && (_jsx("span", { className: "ml-1 text-[10px] font-bold text-[#EF4444]", children: "OVERDUE" }))] }), _jsx("div", { className: "text-xs text-[var(--z-muted)]", children: formatDate(inv.paid_at) }), _jsx("div", { children: _jsx("span", { className: "rounded-full px-2 py-0.5 text-[10px] font-bold uppercase", style: { background: badge.bg, color: badge.color }, children: badge.label }) })] }, inv.id));
                            }))] }), _jsx("div", { className: "sm:hidden space-y-3", children: invoices.length === 0 ? (_jsx("div", { className: "rounded-xl border border-[var(--z-border)] px-6 py-12 text-center text-sm text-[var(--z-muted)]", children: "No invoices match your filters." })) : (invoices.map((inv) => {
                            const badge = statusBadge(inv.status);
                            const overdue = isOverdue(inv);
                            const locInfo = inv.location_id ? LOCATION_MAP[inv.location_id] : null;
                            return (_jsxs("div", { className: "rounded-xl border px-4 py-3 space-y-1.5", style: {
                                    borderColor: overdue ? "#EF444466" : "var(--z-border)",
                                    background: "var(--z-surface)",
                                }, children: [_jsxs("div", { className: "flex items-start justify-between gap-2", children: [_jsxs("div", { className: "min-w-0", children: [_jsx("div", { className: "truncate font-bold text-[var(--z-fg)]", children: inv.customer_name || "—" }), inv.customer_email && _jsx("div", { className: "truncate text-xs text-[var(--z-muted)]", children: inv.customer_email })] }), _jsx("span", { className: "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase", style: { background: badge.bg, color: badge.color }, children: badge.label })] }), _jsxs("div", { className: "flex flex-wrap items-center gap-x-3 gap-y-1 text-xs", children: [_jsx("span", { className: "font-semibold text-[var(--z-fg)]", children: formatCents(inv.amount_cents) }), locInfo && _jsx("span", { className: "rounded-full px-2 py-0.5 text-[10px] font-bold", style: { background: `${locInfo.color}22`, color: locInfo.color }, children: locInfo.name }), inv.invoice_number && _jsxs("span", { className: "text-[var(--z-muted)]", children: ["#", inv.invoice_number] })] }), _jsxs("div", { className: "flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-[var(--z-muted)]", children: [inv.due_date && _jsxs("span", { style: { color: overdue ? "#EF4444" : undefined }, children: ["Due ", formatDate(inv.due_date), overdue ? " · OVERDUE" : ""] }), inv.paid_at && _jsxs("span", { children: ["Paid ", formatDate(inv.paid_at)] })] }), inv.family_id && (_jsx(Link, { href: `/crm/families/${inv.family_id}`, className: "text-[10px] hover:underline", style: { color: "var(--z-accent)" }, children: "View family \u2192" }))] }, inv.id));
                        })) }), totalPages > 1 && (_jsxs("div", { className: "flex items-center justify-between text-sm", children: [_jsxs("span", { className: "text-[var(--z-muted)]", children: ["Page ", page, " of ", totalPages, " (", totalCount.toLocaleString(), " total)"] }), _jsxs("div", { className: "flex gap-2", children: [_jsx("button", { onClick: () => handlePageChange(page - 1), disabled: page <= 1, className: "rounded-lg border border-[var(--z-border)] bg-[var(--z-surface)] px-3 py-1.5 text-sm font-semibold text-[var(--z-muted)] disabled:opacity-40 hover:text-[var(--z-fg)] transition-colors", children: "\u2190 Prev" }), _jsx("button", { onClick: () => handlePageChange(page + 1), disabled: page >= totalPages, className: "rounded-lg border border-[var(--z-border)] bg-[var(--z-surface)] px-3 py-1.5 text-sm font-semibold text-[var(--z-muted)] disabled:opacity-40 hover:text-[var(--z-fg)] transition-colors", children: "Next \u2192" })] })] }))] }), showCreateModal && (_jsx(CreateInvoiceModal, { onClose: () => setShowCreateModal(false) }))] }));
}
// ── Create Invoice Modal ─────────────────────────────────────────────────────
function CreateInvoiceModal({ onClose }) {
    // Family search autocomplete
    const [searchQuery, setSearchQuery] = React.useState("");
    const [searchResults, setSearchResults] = React.useState([]);
    const [selectedFamilyId, setSelectedFamilyId] = React.useState(null);
    const [showDropdown, setShowDropdown] = React.useState(false);
    const [searching, setSearching] = React.useState(false);
    // Invoice fields
    const [customerName, setCustomerName] = React.useState("");
    const [customerEmail, setCustomerEmail] = React.useState("");
    const [amountDollars, setAmountDollars] = React.useState("");
    const [dueDate, setDueDate] = React.useState(() => {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    });
    const [note, setNote] = React.useState("");
    const [saving, setSaving] = React.useState(false);
    const [error, setError] = React.useState(null);
    const [success, setSuccess] = React.useState(false);
    // Debounced family search
    React.useEffect(() => {
        if (!searchQuery.trim() || selectedFamilyId) {
            setSearchResults([]);
            setShowDropdown(false);
            return;
        }
        const t = setTimeout(async () => {
            var _a;
            setSearching(true);
            try {
                const res = await fetch(`/api/families?search=${encodeURIComponent(searchQuery.trim())}&limit=10`);
                if (res.ok) {
                    const j = await res.json();
                    const items = ((_a = j === null || j === void 0 ? void 0 : j.data) !== null && _a !== void 0 ? _a : []);
                    setSearchResults(items);
                    setShowDropdown(items.length > 0);
                }
            }
            finally {
                setSearching(false);
            }
        }, 250);
        return () => clearTimeout(t);
    }, [searchQuery, selectedFamilyId]);
    function selectFamily(f) {
        var _a;
        setSelectedFamilyId(f.id);
        setCustomerName(f.name);
        setCustomerEmail((_a = f.primary_email) !== null && _a !== void 0 ? _a : "");
        setSearchQuery(f.name);
        setShowDropdown(false);
        setSearchResults([]);
    }
    function clearFamily() {
        setSelectedFamilyId(null);
        setSearchQuery("");
        setCustomerName("");
        setCustomerEmail("");
        setSearchResults([]);
        setShowDropdown(false);
    }
    async function handleSubmit(e) {
        var _a;
        e.preventDefault();
        if (!customerName.trim() || !amountDollars || !dueDate)
            return;
        setSaving(true);
        setError(null);
        try {
            const res = await fetch("/api/invoices/create", {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({
                    customer_name: customerName.trim(),
                    customer_email: customerEmail.trim() || null,
                    family_id: selectedFamilyId,
                    amount_cents: Math.round(parseFloat(amountDollars) * 100),
                    due_date: dueDate,
                    note: note.trim() || null,
                }),
            });
            if (!res.ok) {
                const j = await res.json().catch(() => ({}));
                throw new Error((_a = j === null || j === void 0 ? void 0 : j.error) !== null && _a !== void 0 ? _a : "Failed to create invoice");
            }
            setSuccess(true);
            setTimeout(() => { onClose(); window.location.reload(); }, 1500);
        }
        catch (err) {
            setError(err instanceof Error ? err.message : "Unknown error");
        }
        finally {
            setSaving(false);
        }
    }
    return (_jsxs("div", { className: "fixed inset-0 z-[60] flex items-center justify-center p-4", onClick: onClose, children: [_jsx("div", { className: "absolute inset-0 bg-black/60 backdrop-blur-sm" }), _jsxs("div", { className: "relative w-full max-w-md rounded-2xl border border-[#2b2b2f] bg-[#0f0f12] p-6 shadow-2xl space-y-4", onClick: e => e.stopPropagation(), children: [_jsx("h3", { className: "text-base font-bold text-white", children: "Create Invoice" }), success ? (_jsx("p", { className: "text-sm text-[#00ff88] font-semibold", children: "Invoice created successfully!" })) : (_jsxs("form", { onSubmit: handleSubmit, className: "space-y-3", children: [_jsxs("div", { className: "space-y-1 relative", children: [_jsxs("label", { className: "block text-[10px] font-semibold uppercase tracking-wider text-[#909098]", children: ["Family ", _jsx("span", { className: "text-[#00ff88]", children: "*" })] }), _jsxs("div", { className: "relative flex items-center", children: [_jsx("input", { type: "text", autoFocus: true, required: true, value: searchQuery, onChange: e => { setSearchQuery(e.target.value); if (selectedFamilyId)
                                                    clearFamily(); }, placeholder: "Search by family name or email\u2026", className: "w-full rounded-xl border border-[#2b2b2f] bg-[#1a1a1e] px-3 py-2 text-sm text-white placeholder-[#505055] focus:border-[#00ff88]/50 focus:outline-none pr-8" }), searching && (_jsx("span", { className: "absolute right-3 text-[10px] text-[#505055]", children: "searching\u2026" })), selectedFamilyId && (_jsx("button", { type: "button", onClick: clearFamily, className: "absolute right-3 text-[#505055] hover:text-white text-xs", children: "\u2715" }))] }), showDropdown && (_jsx("div", { className: "absolute z-10 w-full mt-1 rounded-xl border border-[#2b2b2f] bg-[#0f0f12] shadow-2xl overflow-hidden", children: searchResults.map(f => (_jsxs("button", { type: "button", onClick: () => selectFamily(f), className: "w-full text-left px-3 py-2.5 text-sm hover:bg-[#1a1a1e] transition-colors", children: [_jsx("span", { className: "text-white font-medium", children: f.name }), f.primary_email && _jsx("span", { className: "ml-2 text-[#505055] text-xs", children: f.primary_email })] }, f.id))) })), selectedFamilyId && (_jsx("p", { className: "text-[10px] text-[#00ff88]", children: "Family selected \u2014 name and email pre-filled below" }))] }), _jsxs("div", { className: "space-y-1", children: [_jsxs("label", { className: "block text-[10px] font-semibold uppercase tracking-wider text-[#909098]", children: ["Customer Name ", _jsx("span", { className: "text-[#00ff88]", children: "*" })] }), _jsx("input", { type: "text", required: true, value: customerName, onChange: e => setCustomerName(e.target.value), placeholder: "Auto-filled from family selection", className: "w-full rounded-xl border border-[#2b2b2f] bg-[#1a1a1e] px-3 py-2 text-sm text-white placeholder-[#505055] focus:border-[#00ff88]/50 focus:outline-none" })] }), _jsxs("div", { className: "space-y-1", children: [_jsx("label", { className: "block text-[10px] font-semibold uppercase tracking-wider text-[#909098]", children: "Email" }), _jsx("input", { type: "email", value: customerEmail, onChange: e => setCustomerEmail(e.target.value), placeholder: "Auto-filled from family selection", className: "w-full rounded-xl border border-[#2b2b2f] bg-[#1a1a1e] px-3 py-2 text-sm text-white placeholder-[#505055] focus:border-[#00ff88]/50 focus:outline-none" })] }), _jsxs("div", { className: "grid grid-cols-2 gap-3", children: [_jsxs("div", { className: "space-y-1", children: [_jsxs("label", { className: "block text-[10px] font-semibold uppercase tracking-wider text-[#909098]", children: ["Amount ($) ", _jsx("span", { className: "text-[#00ff88]", children: "*" })] }), _jsx("input", { type: "number", required: true, min: "0.01", step: "0.01", value: amountDollars, onChange: e => setAmountDollars(e.target.value), placeholder: "45.00", className: "w-full rounded-xl border border-[#2b2b2f] bg-[#1a1a1e] px-3 py-2 text-sm text-white placeholder-[#505055] focus:border-[#00ff88]/50 focus:outline-none" })] }), _jsxs("div", { className: "space-y-1", children: [_jsxs("label", { className: "block text-[10px] font-semibold uppercase tracking-wider text-[#909098]", children: ["Due Date ", _jsx("span", { className: "text-[#00ff88]", children: "*" })] }), _jsx("input", { type: "date", required: true, value: dueDate, onChange: e => setDueDate(e.target.value), className: "w-full rounded-xl border border-[#2b2b2f] bg-[#1a1a1e] px-3 py-2 text-sm text-white focus:border-[#00ff88]/50 focus:outline-none" })] })] }), _jsxs("div", { className: "space-y-1", children: [_jsx("label", { className: "block text-[10px] font-semibold uppercase tracking-wider text-[#909098]", children: "Note" }), _jsx("textarea", { rows: 2, value: note, onChange: e => setNote(e.target.value), placeholder: "Optional note or description", className: "w-full rounded-xl border border-[#2b2b2f] bg-[#1a1a1e] px-3 py-2 text-sm text-white placeholder-[#505055] focus:border-[#00ff88]/50 focus:outline-none resize-none" })] }), error && _jsx("p", { className: "text-xs text-red-400", children: error }), _jsxs("div", { className: "flex gap-2 pt-1", children: [_jsx("button", { type: "button", onClick: onClose, className: "flex-1 rounded-xl border border-[#2b2b2f] bg-[#1a1a1e] px-3 py-2.5 text-sm font-semibold text-[#909098] hover:text-white transition-colors", children: "Cancel" }), _jsx("button", { type: "submit", disabled: saving || !customerName.trim() || !amountDollars || !dueDate, className: "flex-1 rounded-xl border border-[#00ff88]/40 bg-[#00ff88]/15 px-3 py-2.5 text-sm font-semibold text-[#00ff88] disabled:opacity-40 hover:bg-[#00ff88]/25 transition-colors", children: saving ? "Creating…" : "Create Invoice" })] })] }))] })] }));
}
