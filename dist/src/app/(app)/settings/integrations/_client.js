"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import * as React from "react";
import Link from "next/link";
import { PageShell } from "@/components/layouts/PageShell";
import { SettingsSection } from "@/components/settings/SettingsSection";
import { SettingsGroup } from "@/components/settings/SettingsGroup";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
// ─── Status badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
    const cfg = {
        connected: { label: "Connected", bg: "rgba(34,197,94,0.15)", border: "rgba(34,197,94,0.4)", text: "#86efac" },
        disconnected: { label: "Not set", bg: "rgba(107,114,128,0.12)", border: "rgba(107,114,128,0.3)", text: "var(--z-muted)" },
        stub: { label: "Stub / Ready", bg: "rgba(168,85,247,0.12)", border: "rgba(168,85,247,0.35)", text: "#d8b4fe" },
    }[status];
    return (_jsx("span", { className: "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider", style: { background: cfg.bg, borderColor: cfg.border, color: cfg.text }, children: cfg.label }));
}
// ─── Integration card ─────────────────────────────────────────────────────────
function IntegrationCard({ name, description, icon, status, defaultOpen, children, }) {
    const [open, setOpen] = React.useState(defaultOpen !== null && defaultOpen !== void 0 ? defaultOpen : false);
    return (_jsxs("div", { className: "rounded-xl border", style: { borderColor: "var(--z-border)", background: "var(--z-surface)" }, children: [_jsxs("button", { type: "button", onClick: () => setOpen((p) => !p), className: "flex w-full items-center gap-4 px-5 py-4 text-left", children: [_jsx("div", { className: "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border text-lg", style: { borderColor: "var(--z-border)", background: "var(--z-surface-2)" }, children: icon }), _jsxs("div", { className: "min-w-0 flex-1", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("span", { className: "text-sm font-bold text-[var(--z-fg)]", children: name }), _jsx(StatusBadge, { status: status })] }), _jsx("div", { className: "mt-0.5 text-xs text-[var(--z-muted)]", children: description })] }), _jsx("svg", { className: `h-4 w-4 shrink-0 text-[var(--z-muted)] transition-transform ${open ? "rotate-90" : ""}`, fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 2.5, children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M9 5l7 7-7 7" }) })] }), open && children && (_jsx("div", { className: "border-t px-5 py-4", style: { borderColor: "var(--z-border)", background: "var(--z-surface-2)" }, children: children }))] }));
}
function SquareCard() {
    const [syncStatus, setSyncStatus] = React.useState("idle");
    const [syncResult, setSyncResult] = React.useState(null);
    const [syncProgress, setSyncProgress] = React.useState(null);
    async function runSync() {
        var _a, _b, _c, _d;
        setSyncStatus("running");
        setSyncResult(null);
        setSyncProgress("Connecting to Square…");
        try {
            const body = undefined; // always month-to-date
            const res = await fetch("/api/integrations/square/sync", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body,
            });
            if (!res.body)
                throw new Error("No response body from sync endpoint");
            // Consume the SSE stream for live progress updates
            const reader = res.body.getReader();
            const decoder = new TextDecoder();
            let buffer = "";
            while (true) {
                const { done, value } = await reader.read();
                if (done)
                    break;
                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split("\n");
                buffer = (_a = lines.pop()) !== null && _a !== void 0 ? _a : "";
                for (const line of lines) {
                    if (!line.startsWith("data: "))
                        continue;
                    try {
                        const event = JSON.parse(line.slice(6));
                        if (event.status === "running") {
                            setSyncProgress((_b = event.message) !== null && _b !== void 0 ? _b : "Syncing…");
                        }
                        else if (event.status === "success") {
                            setSyncStatus("success");
                            setSyncResult((_c = event.message) !== null && _c !== void 0 ? _c : "Sync complete.");
                            setSyncProgress(null);
                        }
                        else if (event.status === "error") {
                            setSyncStatus("error");
                            setSyncResult((_d = event.error) !== null && _d !== void 0 ? _d : "Sync failed.");
                            setSyncProgress(null);
                        }
                    }
                    catch ( /* ignore malformed events */_e) { /* ignore malformed events */ }
                }
            }
            // If stream ended without a final status event, treat as done
            setSyncStatus((prev) => prev === "running" ? "success" : prev);
            setSyncProgress(null);
        }
        catch (err) {
            setSyncStatus("error");
            setSyncResult(err instanceof Error ? err.message : "Network error");
            setSyncProgress(null);
        }
    }
    const statusColor = syncStatus === "success" ? "#86efac" : syncStatus === "error" ? "#fca5a5" : "var(--z-muted)";
    return (_jsx(IntegrationCard, { name: "Square", description: "Point-of-sale, invoices, payments, and customer records. Your primary billing source.", icon: "\u25FC", status: "connected", defaultOpen: true, children: _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "rounded-lg border px-4 py-3 text-xs", style: { borderColor: "rgba(0,255,136,0.2)", background: "rgba(0,255,136,0.04)" }, children: [_jsx("p", { className: "mb-1.5 font-bold text-[#00ff88]", children: "What gets synced" }), _jsxs("ul", { className: "space-y-1 text-[var(--z-muted)]", children: [_jsx("li", { children: "\u2022 Invoices and payments for the current month (month-to-date)" }), _jsx("li", { children: "\u2022 Linked to student/family records by email match" }), _jsx("li", { children: "\u2022 Real-time updates via webhook (invoice paid, refunds, new payments)" })] })] }), _jsxs("div", { className: "space-y-2", children: [_jsx("p", { className: "text-xs font-semibold text-[var(--z-fg)]", children: "Manual sync" }), _jsxs("p", { className: "text-xs text-[var(--z-muted)]", children: ["Pulls all invoices and payments for the ", _jsx("strong", { children: "current month" }), " from Square. Use this if the dashboard numbers look stale."] }), _jsx("div", { className: "flex items-center gap-3", children: _jsx(Button, { type: "button", variant: "primary", size: "sm", disabled: syncStatus === "running", onClick: runSync, children: syncStatus === "running" ? "Syncing…" : "Sync Now" }) }), syncStatus === "running" && (_jsxs("div", { className: "space-y-1", children: [_jsxs("div", { className: "flex items-center gap-2 text-xs text-[var(--z-muted)]", children: [_jsxs("svg", { className: "h-3.5 w-3.5 animate-spin shrink-0", viewBox: "0 0 24 24", fill: "none", children: [_jsx("circle", { className: "opacity-25", cx: "12", cy: "12", r: "10", stroke: "currentColor", strokeWidth: "4" }), _jsx("path", { className: "opacity-75", fill: "currentColor", d: "M4 12a8 8 0 018-8v8z" })] }), syncProgress !== null && syncProgress !== void 0 ? syncProgress : "Syncing…"] }), _jsx("p", { className: "text-[10px] text-[var(--z-muted)] opacity-60", children: "Month-to-date sync usually completes in under 30 seconds." })] })), syncResult && syncStatus !== "running" && (_jsx("div", { className: "rounded-lg border px-3 py-2 text-xs", style: {
                                borderColor: syncStatus === "success" ? "rgba(34,197,94,0.3)" : "rgba(239,68,68,0.3)",
                                background: syncStatus === "success" ? "rgba(34,197,94,0.06)" : "rgba(239,68,68,0.06)",
                                color: statusColor,
                            }, children: syncResult }))] }), _jsxs("div", { className: "space-y-2 border-t pt-4", style: { borderColor: "var(--z-border)" }, children: [_jsx("p", { className: "text-xs font-semibold text-[var(--z-fg)]", children: "Live webhook (real-time updates)" }), _jsxs("p", { className: "text-xs text-[var(--z-muted)]", children: ["Once synced, Square will push every new payment, invoice, and customer change to Ziro automatically. In your", " ", _jsx("a", { href: "https://developer.squareup.com/apps", target: "_blank", rel: "noopener noreferrer", className: "text-[var(--z-accent)] underline", children: "Square Developer Dashboard" }), ", add this webhook URL and subscribe to the events listed below."] }), _jsx("div", { className: "rounded-lg border px-3 py-2 font-mono text-xs", style: { borderColor: "var(--z-border)", background: "var(--z-surface)", color: "#00ff88" }, children: "https://app.zirowork.com/api/integrations/square/webhook" }), _jsxs("p", { className: "text-[10px] text-[var(--z-muted)]", children: ["Subscribe to: ", _jsx("code", { className: "rounded bg-[var(--z-surface)] px-1", children: "invoice.*" }), " ", _jsx("code", { className: "rounded bg-[var(--z-surface)] px-1", children: "payment.*" }), " ", _jsx("code", { className: "rounded bg-[var(--z-surface)] px-1", children: "customer.*" }), " ", _jsx("code", { className: "rounded bg-[var(--z-surface)] px-1", children: "refund.*" })] })] })] }) }));
}
// ─── Main client ──────────────────────────────────────────────────────────────
export function IntegrationsSettingsClient() {
    // QUO fields
    const [quoApiKey, setQuoApiKey] = React.useState("");
    const [quoWebhookSecret, setQuoWebhookSecret] = React.useState("");
    // Gmail fields
    const [gmailClientId, setGmailClientId] = React.useState("");
    const [gmailClientSecret, setGmailClientSecret] = React.useState("");
    const [gmailRefreshToken, setGmailRefreshToken] = React.useState("");
    const [gmailSenderEmail, setGmailSenderEmail] = React.useState("");
    // Twilio fields
    const [twilioSid, setTwilioSid] = React.useState("");
    const [twilioToken, setTwilioToken] = React.useState("");
    const [twilioPhone, setTwilioPhone] = React.useState("");
    // Stripe fields
    const [stripePublishable, setStripePublishable] = React.useState("");
    const [stripeSecret, setStripeSecret] = React.useState("");
    const [stripeWebhook, setStripeWebhook] = React.useState("");
    function stubStatus(key) {
        if (!key.trim())
            return "disconnected";
        if (key.startsWith("sk_live") || key.startsWith("pk_live"))
            return "connected";
        return "stub";
    }
    return (_jsxs(PageShell, { title: "Integrations", children: [_jsx("div", { className: "mb-[var(--z-space-4)] text-xs font-semibold uppercase tracking-[0.14em] text-[var(--z-muted)]", children: _jsx(Link, { className: "text-[var(--z-accent)] hover:underline", href: "/settings", children: "\u2190 All settings" }) }), _jsxs(SettingsSection, { title: "Integrations", description: "Connect external services. Keys are stored in your environment \u2014 never committed to source control.", children: [_jsxs("div", { className: "rounded-xl border px-4 py-3 text-xs text-[var(--z-muted)]", style: { borderColor: "rgba(168,85,247,0.3)", background: "rgba(168,85,247,0.06)" }, children: [_jsx("span", { className: "font-bold text-purple-300", children: "Stub mode:" }), " Fields here are UI scaffolding only. No API calls are made until you wire the corresponding environment variables in your deployment. Save is intentionally disabled until the backend pipeline is connected."] }), _jsxs(SettingsGroup, { title: "Payments & billing", children: [_jsx(SquareCard, {}), _jsx(IntegrationCard, { name: "Stripe", description: "Invoice payments, subscription billing, and payout management.", icon: "\uD83D\uDCB3", status: stubStatus(stripePublishable), children: _jsxs("div", { className: "space-y-3", children: [_jsx(Input, { label: "Publishable Key", value: stripePublishable, onChange: (e) => setStripePublishable(e.target.value), placeholder: "pk_live_\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022" }), _jsx(Input, { label: "Secret Key", value: stripeSecret, onChange: (e) => setStripeSecret(e.target.value), placeholder: "sk_live_\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022", type: "password" }), _jsx(Input, { label: "Webhook Signing Secret", value: stripeWebhook, onChange: (e) => setStripeWebhook(e.target.value), placeholder: "whsec_\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022", type: "password" }), _jsxs("p", { className: "text-[10px] text-[var(--z-muted)]", children: ["Set ", _jsx("code", { className: "rounded bg-[var(--z-surface)] px-1", children: "STRIPE_PUBLISHABLE_KEY" }), ",", " ", _jsx("code", { className: "rounded bg-[var(--z-surface)] px-1", children: "STRIPE_SECRET_KEY" }), ", and", " ", _jsx("code", { className: "rounded bg-[var(--z-surface)] px-1", children: "STRIPE_WEBHOOK_SECRET" }), " in Vercel."] }), _jsx(Button, { type: "button", variant: "secondary", size: "sm", disabled: true, children: "Save Stripe config" })] }) })] }), _jsxs(SettingsGroup, { title: "Email providers", children: [_jsx(IntegrationCard, { name: "QUO", description: "Transactional email for invoices, receipts, and automated outreach.", icon: "\u2709\uFE0F", status: stubStatus(quoApiKey), children: _jsxs("div", { className: "space-y-3", children: [_jsx(Input, { label: "QUO API Key", value: quoApiKey, onChange: (e) => setQuoApiKey(e.target.value), placeholder: "quo_live_\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022", type: "password" }), _jsx(Input, { label: "Webhook Secret", value: quoWebhookSecret, onChange: (e) => setQuoWebhookSecret(e.target.value), placeholder: "whsec_\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022", type: "password" }), _jsxs("p", { className: "text-[10px] text-[var(--z-muted)]", children: ["Set ", _jsx("code", { className: "rounded bg-[var(--z-surface)] px-1", children: "QUO_API_KEY" }), " and", " ", _jsx("code", { className: "rounded bg-[var(--z-surface)] px-1", children: "QUO_WEBHOOK_SECRET" }), " in your Vercel environment variables. No emails are sent until these are live."] }), _jsx(Button, { type: "button", variant: "secondary", size: "sm", disabled: true, children: "Save QUO config" })] }) }), _jsx(IntegrationCard, { name: "Gmail (OAuth)", description: "Send emails from your studio Gmail account via OAuth2. No SMTP passwords.", icon: "\uD83D\uDCE7", status: stubStatus(gmailClientId), children: _jsxs("div", { className: "space-y-3", children: [_jsx(Input, { label: "OAuth Client ID", value: gmailClientId, onChange: (e) => setGmailClientId(e.target.value), placeholder: "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022.apps.googleusercontent.com" }), _jsx(Input, { label: "OAuth Client Secret", value: gmailClientSecret, onChange: (e) => setGmailClientSecret(e.target.value), placeholder: "GOCSPX-\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022", type: "password" }), _jsx(Input, { label: "Refresh Token", value: gmailRefreshToken, onChange: (e) => setGmailRefreshToken(e.target.value), placeholder: "1//\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022", type: "password" }), _jsx(Input, { label: "Sender Email", value: gmailSenderEmail, onChange: (e) => setGmailSenderEmail(e.target.value), placeholder: "studio@yourdomain.com", type: "email" }), _jsxs("p", { className: "text-[10px] text-[var(--z-muted)]", children: ["Set ", _jsx("code", { className: "rounded bg-[var(--z-surface)] px-1", children: "GMAIL_CLIENT_ID" }), ",", " ", _jsx("code", { className: "rounded bg-[var(--z-surface)] px-1", children: "GMAIL_CLIENT_SECRET" }), ",", " ", _jsx("code", { className: "rounded bg-[var(--z-surface)] px-1", children: "GMAIL_REFRESH_TOKEN" }), ", and", " ", _jsx("code", { className: "rounded bg-[var(--z-surface)] px-1", children: "GMAIL_SENDER_EMAIL" }), " in Vercel. No emails are sent until all four are set."] }), _jsx(Button, { type: "button", variant: "secondary", size: "sm", disabled: true, children: "Save Gmail config" })] }) })] }), _jsx(SettingsGroup, { title: "SMS", children: _jsx(IntegrationCard, { name: "Twilio", description: "SMS reminders, callout notifications, and two-way parent messaging.", icon: "\uD83D\uDCAC", status: stubStatus(twilioSid), children: _jsxs("div", { className: "space-y-3", children: [_jsx(Input, { label: "Account SID", value: twilioSid, onChange: (e) => setTwilioSid(e.target.value), placeholder: "AC\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022" }), _jsx(Input, { label: "Auth Token", value: twilioToken, onChange: (e) => setTwilioToken(e.target.value), placeholder: "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022", type: "password" }), _jsx(Input, { label: "From Phone Number", value: twilioPhone, onChange: (e) => setTwilioPhone(e.target.value), placeholder: "+1 (555) 000-0000", type: "tel" }), _jsxs("p", { className: "text-[10px] text-[var(--z-muted)]", children: ["Set ", _jsx("code", { className: "rounded bg-[var(--z-surface)] px-1", children: "TWILIO_ACCOUNT_SID" }), ",", " ", _jsx("code", { className: "rounded bg-[var(--z-surface)] px-1", children: "TWILIO_AUTH_TOKEN" }), ", and", " ", _jsx("code", { className: "rounded bg-[var(--z-surface)] px-1", children: "TWILIO_PHONE_NUMBER" }), " in Vercel."] }), _jsx(Button, { type: "button", variant: "secondary", size: "sm", disabled: true, children: "Save Twilio config" })] }) }) })] })] }));
}
