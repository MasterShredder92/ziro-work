"use client";
import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
import { useState } from "react";
const SECTIONS = [
    {
        key: "billing",
        label: "Billing",
        description: "Tax rates, invoice terms, currency, payment methods.",
    },
    {
        key: "scheduling",
        label: "Scheduling",
        description: "Default lesson durations, buffers, business hours.",
    },
    {
        key: "messaging",
        label: "Messaging",
        description: "Email & SMS providers, quiet hours.",
    },
    {
        key: "automation",
        label: "Automation",
        description: "Rate limits, concurrency, retry behavior.",
    },
    {
        key: "forms",
        label: "Forms",
        description: "Public form rules, captcha, throttle.",
    },
    {
        key: "storage",
        label: "Storage",
        description: "Upload size limits, retention, allowed MIME types.",
    },
];
export function TenantSettingsForm({ tenantId, settings, canWrite, }) {
    var _a, _b, _c, _d, _e, _f;
    const [current, setCurrent] = useState(settings);
    const [drafts, setDrafts] = useState({
        billing: JSON.stringify((_a = settings.billing) !== null && _a !== void 0 ? _a : {}, null, 2),
        scheduling: JSON.stringify((_b = settings.scheduling) !== null && _b !== void 0 ? _b : {}, null, 2),
        messaging: JSON.stringify((_c = settings.messaging) !== null && _c !== void 0 ? _c : {}, null, 2),
        automation: JSON.stringify((_d = settings.automation) !== null && _d !== void 0 ? _d : {}, null, 2),
        forms: JSON.stringify((_e = settings.forms) !== null && _e !== void 0 ? _e : {}, null, 2),
        storage: JSON.stringify((_f = settings.storage) !== null && _f !== void 0 ? _f : {}, null, 2),
    });
    const [saving, setSaving] = useState(null);
    const [errors, setErrors] = useState({});
    const [savedAt, setSavedAt] = useState({});
    async function save(section) {
        var _a, _b;
        setSaving(section);
        setErrors((e) => (Object.assign(Object.assign({}, e), { [section]: undefined })));
        try {
            const parsed = JSON.parse((_a = drafts[section]) !== null && _a !== void 0 ? _a : "{}");
            const patch = { [section]: parsed };
            const res = await fetch(`/api/admin/settings?tenantId=${encodeURIComponent(tenantId)}`, {
                method: "PATCH",
                headers: { "content-type": "application/json" },
                body: JSON.stringify(patch),
            });
            const data = (await res.json().catch(() => null));
            if (!res.ok)
                throw new Error((_b = data === null || data === void 0 ? void 0 : data.error) !== null && _b !== void 0 ? _b : `HTTP ${res.status}`);
            if (data === null || data === void 0 ? void 0 : data.data) {
                setCurrent(data.data);
                setDrafts((d) => (Object.assign(Object.assign({}, d), { [section]: JSON.stringify(data.data[section], null, 2) })));
            }
            setSavedAt((s) => (Object.assign(Object.assign({}, s), { [section]: new Date().toLocaleTimeString() })));
        }
        catch (err) {
            setErrors((e) => (Object.assign(Object.assign({}, e), { [section]: err instanceof Error ? err.message : "Failed to save" })));
        }
        finally {
            setSaving(null);
        }
    }
    return (_jsxs("div", { className: "flex flex-col gap-3", children: [_jsxs("div", { className: "text-xs text-[var(--z-muted)]", children: ["Last updated ", new Date(current.updated_at).toLocaleString()] }), SECTIONS.map((s) => (_jsxs("div", { className: "rounded-[var(--z-radius-md)] border border-[var(--z-border)] p-3", children: [_jsxs("div", { className: "flex items-start justify-between gap-3", children: [_jsxs("div", { children: [_jsx("div", { className: "font-semibold text-[var(--z-fg)]", children: s.label }), _jsx("div", { className: "text-xs text-[var(--z-muted)]", children: s.description })] }), savedAt[s.key] ? (_jsxs("span", { className: "text-[11px] text-[var(--z-muted)]", children: ["Saved at ", savedAt[s.key]] })) : null] }), _jsx("textarea", { value: drafts[s.key], onChange: (e) => setDrafts((d) => (Object.assign(Object.assign({}, d), { [s.key]: e.target.value }))), disabled: !canWrite, rows: 8, className: "mt-2 w-full rounded-[var(--z-radius-md)] border border-[var(--z-border)] bg-[var(--z-bg)] p-2 font-mono text-xs" }), errors[s.key] ? (_jsx("div", { className: "mt-2 text-xs text-red-400", children: errors[s.key] })) : null, _jsx("div", { className: "mt-2 flex justify-end", children: _jsx("button", { type: "button", disabled: !canWrite || saving === s.key, onClick: () => save(s.key), className: "h-8 rounded-[var(--z-radius-md)] bg-[var(--z-accent)] px-3 text-xs font-semibold text-black disabled:opacity-50", children: saving === s.key ? "Saving…" : "Save section" }) })] }, s.key)))] }));
}
