import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { redirect } from "next/navigation";
import { requirePermission } from "@/lib/auth/guards";
import { getBillingSettings } from "@data/billingSettings";
import { formatCents } from "../components/format";
export const dynamic = "force-dynamic";
async function resolveSession() {
    try {
        return await requirePermission("billing.read")();
    }
    catch (_a) {
        redirect("/dashboard");
    }
}
export default async function BillingSettingsPage() {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l;
    const session = await resolveSession();
    const settings = await getBillingSettings(session.tenantId);
    const rows = [
        {
            label: "Invoice prefix",
            value: (_a = settings === null || settings === void 0 ? void 0 : settings.invoice_prefix) !== null && _a !== void 0 ? _a : "INV-",
        },
        {
            label: "Next invoice number",
            value: String((_b = settings === null || settings === void 0 ? void 0 : settings.invoice_next_number) !== null && _b !== void 0 ? _b : 1001),
        },
        {
            label: "Pad width",
            value: String((_c = settings === null || settings === void 0 ? void 0 : settings.invoice_pad_width) !== null && _c !== void 0 ? _c : 4),
        },
        {
            label: "Default terms",
            value: (_d = settings === null || settings === void 0 ? void 0 : settings.default_terms) !== null && _d !== void 0 ? _d : "Net 15",
        },
        {
            label: "Default net days",
            value: String((_e = settings === null || settings === void 0 ? void 0 : settings.default_net_days) !== null && _e !== void 0 ? _e : 15),
        },
        {
            label: "Default tax rate",
            value: `${(((_f = settings === null || settings === void 0 ? void 0 : settings.default_tax_rate_bp) !== null && _f !== void 0 ? _f : 0) / 100).toFixed(2)}%`,
        },
        {
            label: "Default currency",
            value: (_g = settings === null || settings === void 0 ? void 0 : settings.default_currency) !== null && _g !== void 0 ? _g : "USD",
        },
        {
            label: "Late fee",
            value: formatCents((_h = settings === null || settings === void 0 ? void 0 : settings.late_fee_cents) !== null && _h !== void 0 ? _h : 0, (_j = settings === null || settings === void 0 ? void 0 : settings.default_currency) !== null && _j !== void 0 ? _j : "USD"),
        },
        {
            label: "Late fee grace days",
            value: String((_k = settings === null || settings === void 0 ? void 0 : settings.late_fee_grace_days) !== null && _k !== void 0 ? _k : 3),
        },
        {
            label: "Accepted payment methods",
            value: ((_l = settings === null || settings === void 0 ? void 0 : settings.payment_methods) !== null && _l !== void 0 ? _l : ["card", "ach", "cash", "check", "manual"]).join(", "),
        },
    ];
    return (_jsxs("div", { className: "space-y-4", children: [_jsxs("header", { children: [_jsx("h1", { className: "text-2xl font-semibold text-[var(--z-fg)]", children: "Billing settings" }), _jsx("p", { className: "text-sm text-[var(--z-muted)]", children: "Tax rates, default terms, invoice numbering, and accepted payment methods." })] }), _jsx("div", { className: "overflow-hidden rounded-[var(--z-radius-lg)] border border-[var(--z-border)] bg-[var(--z-surface)]", children: rows.map((row, i) => (_jsxs("div", { className: `flex items-center justify-between px-4 py-3 text-sm ${i < rows.length - 1 ? "border-b border-[var(--z-border)]" : ""}`, children: [_jsx("div", { className: "text-[var(--z-muted)]", children: row.label }), _jsx("div", { className: "font-medium text-[var(--z-fg)]", children: row.value })] }, row.label))) }), _jsxs("div", { className: "rounded-[var(--z-radius-md)] border border-dashed border-[var(--z-border)] bg-[var(--z-bg)] p-4 text-xs text-[var(--z-muted)]", children: ["Settings are editable via ", _jsx("code", { children: "PATCH" }), " on", " ", _jsx("code", { children: "/api/billing/settings" }), " (coming soon) or directly via the", _jsx("code", { children: " billing_settings" }), " table."] })] }));
}
