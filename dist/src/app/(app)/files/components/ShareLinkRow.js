"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useMemo, useState } from "react";
import { normalizeAccessTimestamp } from "@/lib/files/formatters";
import { showFilesToast } from "./filesToast";
function shareUrl(token) {
    if (typeof window !== "undefined")
        return `${window.location.origin}/files/share/${token}`;
    return `/files/share/${token}`;
}
function toIsoDateInput(value) {
    if (!value)
        return "";
    const date = new Date(value);
    if (!Number.isFinite(date.getTime()))
        return "";
    return date.toISOString().slice(0, 10);
}
function endOfDayIso(dateValue) {
    return new Date(`${dateValue}T23:59:59.000Z`).toISOString();
}
function plusDaysIso(days) {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 23, 59, 59, 0)).toISOString();
}
function permissionLabel(value) {
    if (value === "view")
        return "View only";
    if (value === "upload")
        return "Upload only";
    return "View + Upload";
}
function getLinkPermission(link, permissionOverride) {
    var _a;
    if (permissionOverride)
        return permissionOverride;
    const raw = (_a = link.metadata) === null || _a === void 0 ? void 0 : _a.permissionLevel;
    if (raw === "view" || raw === "upload" || raw === "view-upload")
        return raw;
    return "view";
}
function expirationPresetForValue(expiresAt) {
    if (!expiresAt)
        return "none";
    const date = new Date(expiresAt);
    if (!Number.isFinite(date.getTime()))
        return "custom";
    const dayMs = 24 * 60 * 60 * 1000;
    const deltaMs = date.getTime() - Date.now();
    if (deltaMs > 0.5 * dayMs && deltaMs < 1.5 * dayMs)
        return "24h";
    if (deltaMs > 6.5 * dayMs && deltaMs < 7.5 * dayMs)
        return "7d";
    if (deltaMs > 29.5 * dayMs && deltaMs < 30.5 * dayMs)
        return "30d";
    return "custom";
}
function isExpired(expiresAt) {
    if (!expiresAt)
        return false;
    const date = new Date(expiresAt);
    if (!Number.isFinite(date.getTime()))
        return false;
    return date.getTime() < Date.now();
}
export function ShareLinkRow({ link, permissionOverride, expirationOverride, disabledOverride, passwordEnabledOverride, onUpdate, onDelete, onOpenLogs, isCreating = false, }) {
    var _a, _b, _c, _d, _e;
    const [copied, setCopied] = useState(false);
    const [pending, setPending] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [entered, setEntered] = useState(!isCreating);
    const [passwordEnabled, setPasswordEnabled] = useState(Boolean((_a = passwordEnabledOverride !== null && passwordEnabledOverride !== void 0 ? passwordEnabledOverride : link.passwordHash) !== null && _a !== void 0 ? _a : (_b = link.metadata) === null || _b === void 0 ? void 0 : _b.passwordEnabled));
    const [password, setPassword] = useState("");
    const [expiresDate, setExpiresDate] = useState(toIsoDateInput(expirationOverride !== null && expirationOverride !== void 0 ? expirationOverride : link.expiresAt));
    const [preset, setPreset] = useState(expirationPresetForValue(expirationOverride !== null && expirationOverride !== void 0 ? expirationOverride : link.expiresAt));
    const permission = useMemo(() => getLinkPermission(link, permissionOverride), [link, permissionOverride]);
    const disabled = disabledOverride !== null && disabledOverride !== void 0 ? disabledOverride : Boolean((_c = link.metadata) === null || _c === void 0 ? void 0 : _c.linkDisabled);
    const resolvedExpiresAt = expirationOverride !== null && expirationOverride !== void 0 ? expirationOverride : link.expiresAt;
    const lastAccessed = normalizeAccessTimestamp(((_d = link.metadata) !== null && _d !== void 0 ? _d : {}));
    const passwordProtected = Boolean(passwordEnabled || link.passwordHash || ((_e = link.metadata) === null || _e === void 0 ? void 0 : _e.passwordEnabled));
    const expired = isExpired(resolvedExpiresAt);
    useEffect(() => {
        var _a, _b;
        setPasswordEnabled(Boolean((_a = passwordEnabledOverride !== null && passwordEnabledOverride !== void 0 ? passwordEnabledOverride : link.passwordHash) !== null && _a !== void 0 ? _a : (_b = link.metadata) === null || _b === void 0 ? void 0 : _b.passwordEnabled));
    }, [link.id, link.passwordHash, link.metadata, passwordEnabledOverride]);
    useEffect(() => {
        const nextExpiresAt = expirationOverride !== null && expirationOverride !== void 0 ? expirationOverride : link.expiresAt;
        setExpiresDate(toIsoDateInput(nextExpiresAt));
        setPreset(expirationPresetForValue(nextExpiresAt));
    }, [link.id, link.expiresAt, expirationOverride]);
    useEffect(() => {
        if (!isCreating) {
            setEntered(true);
            return;
        }
        setEntered(false);
        const raf = window.requestAnimationFrame(() => setEntered(true));
        return () => window.cancelAnimationFrame(raf);
    }, [isCreating]);
    const runUpdate = async (patch, successMessage) => {
        setPending(true);
        try {
            await onUpdate(link.id, patch);
            if (successMessage)
                showFilesToast(successMessage, "success");
        }
        catch (err) {
            showFilesToast(err instanceof Error ? err.message : "Could not update link", "error");
            throw err;
        }
        finally {
            setPending(false);
        }
    };
    const handlePresetChange = async (nextPreset) => {
        setPreset(nextPreset);
        if (nextPreset === "custom")
            return;
        const expiresAt = nextPreset === "none"
            ? null
            : nextPreset === "24h"
                ? plusDaysIso(1)
                : nextPreset === "7d"
                    ? plusDaysIso(7)
                    : plusDaysIso(30);
        setExpiresDate(toIsoDateInput(expiresAt));
        await runUpdate({ expiresAt }, "Expiration updated.");
    };
    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(shareUrl(link.token));
            setCopied(true);
            showFilesToast("Link copied to clipboard.", "success");
            window.setTimeout(() => setCopied(false), 1500);
        }
        catch (_a) {
            showFilesToast("Could not copy link.", "error");
        }
    };
    const handlePasswordSave = async () => {
        var _a;
        const metadata = Object.assign(Object.assign({}, ((_a = link.metadata) !== null && _a !== void 0 ? _a : {})), { passwordEnabled });
        await runUpdate({ metadata, password: passwordEnabled ? password || null : null }, "Password setting updated.");
        setPassword("");
    };
    const handleDelete = () => {
        if (pending || deleting)
            return;
        setDeleting(true);
        window.setTimeout(() => {
            void Promise.resolve(onDelete(link.id)).catch(() => setDeleting(false));
        }, 180);
    };
    return (_jsxs("li", { className: [
            "rounded border border-[var(--z-border)] bg-white/[0.02] p-2 text-xs transition-all duration-200",
            deleting ? "translate-y-1 opacity-0" : entered ? "translate-y-0 opacity-100" : "translate-y-1 opacity-0",
            isCreating ? "animate-pulse" : "",
        ].join(" "), children: [_jsxs("div", { className: "flex items-start justify-between gap-2", children: [_jsxs("div", { className: "min-w-0", children: [_jsx("div", { className: "truncate text-[var(--z-fg)]", children: shareUrl(link.token) }), _jsxs("div", { className: "mt-1 text-[10px] text-[var(--z-muted)]", children: ["Created ", new Date(link.createdAt).toLocaleString()] }), _jsxs("div", { className: "text-[10px] text-[var(--z-muted)]", title: lastAccessed.iso || undefined, children: ["Last accessed: ", lastAccessed.relative] }), _jsxs("div", { className: "text-[10px] text-[var(--z-muted)]", children: ["Expires ", resolvedExpiresAt ? new Date(resolvedExpiresAt).toLocaleString() : "Never"] })] }), _jsxs("div", { className: "flex flex-wrap justify-end gap-1", children: [disabled ? (_jsx("span", { className: "rounded-full border border-[var(--z-border)] bg-white/[0.04] px-2 py-0.5 text-[10px] text-[var(--z-muted)]", children: "Disabled" })) : null, expired ? (_jsx("span", { className: "rounded-full border border-[var(--z-border)] bg-white/[0.04] px-2 py-0.5 text-[10px] text-[var(--z-muted)]", children: "Expired" })) : null, passwordProtected ? (_jsx("span", { className: "rounded-full border border-[var(--z-border)] bg-white/[0.04] px-2 py-0.5 text-[10px] text-[var(--z-muted)]", children: "Password" })) : null, isCreating ? (_jsx("span", { className: "rounded-full border border-[var(--z-border)] bg-white/[0.04] px-2 py-0.5 text-[10px] text-[var(--z-muted)]", children: "Creating..." })) : null] })] }), _jsxs("div", { className: "mt-2 grid gap-2 md:grid-cols-2", children: [_jsxs("label", { className: "text-[10px] text-[var(--z-muted)]", children: ["Permission", _jsxs("select", { value: permission, disabled: pending || deleting, className: "mt-1 w-full rounded border border-[var(--z-border)] bg-[var(--z-bg)] px-2 py-1 text-xs text-[var(--z-fg)]", onChange: (event) => {
                                    var _a;
                                    return void runUpdate({
                                        metadata: Object.assign(Object.assign({}, ((_a = link.metadata) !== null && _a !== void 0 ? _a : {})), { permissionLevel: event.target.value }),
                                    }, "Permission updated.");
                                }, children: [_jsx("option", { value: "view", children: permissionLabel("view") }), _jsx("option", { value: "upload", children: permissionLabel("upload") }), _jsx("option", { value: "view-upload", children: permissionLabel("view-upload") })] })] }), _jsxs("label", { className: "text-[10px] text-[var(--z-muted)]", children: ["Expiration preset", _jsxs("select", { value: preset, disabled: pending || deleting, className: "mt-1 w-full rounded border border-[var(--z-border)] bg-[var(--z-bg)] px-2 py-1 text-xs text-[var(--z-fg)]", onChange: (event) => void handlePresetChange(event.target.value), children: [_jsx("option", { value: "24h", children: "24 hours" }), _jsx("option", { value: "7d", children: "7 days" }), _jsx("option", { value: "30d", children: "30 days" }), _jsx("option", { value: "none", children: "No expiration" }), _jsx("option", { value: "custom", children: "Custom date" })] })] })] }), _jsxs("label", { className: "mt-2 block text-[10px] text-[var(--z-muted)]", children: ["Expires", _jsx("input", { type: "date", value: expiresDate, disabled: pending || deleting, onChange: (event) => {
                            setPreset("custom");
                            setExpiresDate(event.target.value);
                        }, onBlur: () => {
                            const expiresAt = expiresDate ? endOfDayIso(expiresDate) : null;
                            void runUpdate({ expiresAt }, "Expiration updated.");
                        }, className: "mt-1 w-full rounded border border-[var(--z-border)] bg-[var(--z-bg)] px-2 py-1 text-xs text-[var(--z-fg)]" })] }), _jsxs("div", { className: "mt-2 space-y-1 rounded border border-[var(--z-border)] bg-[var(--z-bg)] p-2", children: [_jsxs("label", { className: "flex items-center gap-2 text-[10px] text-[var(--z-muted)]", children: [_jsx("input", { type: "checkbox", checked: passwordEnabled, disabled: pending || deleting, onChange: (event) => setPasswordEnabled(event.target.checked) }), "Password protect"] }), passwordEnabled ? (_jsx("input", { type: "password", value: password, disabled: pending || deleting, onChange: (event) => setPassword(event.target.value), autoComplete: "new-password", placeholder: "Set password", className: "w-full rounded border border-[var(--z-border)] bg-[var(--z-surface)] px-2 py-1 text-[10px] text-[var(--z-fg)]" })) : null, _jsxs("div", { className: "mt-1 flex flex-wrap gap-1", children: [_jsx("button", { type: "button", disabled: pending || deleting || (passwordEnabled && password.trim().length === 0), onClick: () => void handlePasswordSave(), className: "rounded border border-[var(--z-border)] px-2 py-1 text-[10px] hover:bg-white/[0.05] disabled:opacity-50", children: "Save password" }), _jsx("button", { type: "button", disabled: pending || deleting, onClick: () => {
                                    var _a;
                                    return void runUpdate({
                                        linkDisabled: !disabled,
                                        metadata: Object.assign(Object.assign({}, ((_a = link.metadata) !== null && _a !== void 0 ? _a : {})), { linkDisabled: !disabled }),
                                    }, disabled ? "Link enabled." : "Link disabled.");
                                }, className: "rounded border border-[var(--z-border)] px-2 py-1 text-[10px] hover:bg-white/[0.05]", children: disabled ? "Enable" : "Disable" }), _jsx("button", { type: "button", onClick: () => onOpenLogs(link.id), disabled: deleting, className: "rounded border border-[var(--z-border)] px-2 py-1 text-[10px] hover:bg-white/[0.05]", children: "Access logs" }), _jsx("button", { type: "button", onClick: () => void handleCopy(), disabled: deleting, className: "rounded border border-[var(--z-border)] px-2 py-1 text-[10px] hover:bg-white/[0.05]", children: copied ? "Copied" : "Copy" }), _jsx("button", { type: "button", disabled: pending || deleting, onClick: handleDelete, className: "rounded border border-red-500/40 px-2 py-1 text-[10px] text-red-400 hover:bg-red-500/10 disabled:opacity-50", children: "Delete" })] })] })] }));
}
