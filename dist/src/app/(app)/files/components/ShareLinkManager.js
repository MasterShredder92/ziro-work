"use client";
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { showFilesToast } from "./filesToast";
function buildUrl(token) {
    if (typeof window !== "undefined") {
        return `${window.location.origin}/files/share/${token}`;
    }
    return `/files/share/${token}`;
}
const EXPIRY_PRESETS = [
    { label: "No expiry", seconds: null },
    { label: "1 hour", seconds: 3600 },
    { label: "24 hours", seconds: 24 * 3600 },
    { label: "7 days", seconds: 7 * 24 * 3600 },
    { label: "30 days", seconds: 30 * 24 * 3600 },
];
export function ShareLinkManager({ fileId, folderId, shareLinks, canShare, }) {
    const router = useRouter();
    const [usePassword, setUsePassword] = useState(false);
    const [password, setPassword] = useState("");
    const [maxViews, setMaxViews] = useState("");
    const [expiresSeconds, setExpiresSeconds] = useState(null);
    const [allowDownload, setAllowDownload] = useState(true);
    const [watermarkPreview, setWatermarkPreview] = useState(false);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState(null);
    const [copiedId, setCopiedId] = useState(null);
    const [emailOpen, setEmailOpen] = useState(false);
    const [emailTo, setEmailTo] = useState("");
    const [emailLink, setEmailLink] = useState("");
    const createLink = async () => {
        setBusy(true);
        setError(null);
        try {
            const body = {
                fileId: fileId !== null && fileId !== void 0 ? fileId : null,
                folderId: folderId !== null && folderId !== void 0 ? folderId : null,
                password: usePassword && password ? password : null,
                maxViews: maxViews ? Number(maxViews) : null,
                expiresInSeconds: expiresSeconds,
                allowDownload,
                metadata: {
                    watermarkPreview,
                },
            };
            const res = await fetch("/api/files/share", {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify(body),
            });
            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error((data === null || data === void 0 ? void 0 : data.error) || `Failed (${res.status})`);
            }
            setPassword("");
            setMaxViews("");
            setExpiresSeconds(null);
            showFilesToast("Share link created.", "success");
            router.refresh();
        }
        catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            setError(msg);
            showFilesToast(msg, "error");
        }
        finally {
            setBusy(false);
        }
    };
    const copyLink = async (link) => {
        const text = buildUrl(link.token);
        try {
            await navigator.clipboard.writeText(text);
            setCopiedId(link.id);
            showFilesToast("Link copied to clipboard.", "success");
            window.setTimeout(() => setCopiedId(null), 2000);
        }
        catch (_a) {
            showFilesToast("Could not copy — copy manually.", "error");
        }
    };
    const setDisabled = async (link, linkDisabled) => {
        const res = await fetch("/api/files/share", {
            method: "PATCH",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ id: link.id, linkDisabled }),
        });
        if (res.ok) {
            showFilesToast(linkDisabled ? "Link disabled." : "Link re-enabled.", "success");
            router.refresh();
        }
    };
    const revoke = async (id) => {
        if (!window.confirm("Revoke this share link?"))
            return;
        const res = await fetch(`/api/files/share?id=${id}`, { method: "DELETE" });
        if (res.ok) {
            showFilesToast("Share link revoked.", "success");
            router.refresh();
        }
    };
    return (_jsxs("div", { className: "rounded-md border border-[var(--z-border)] bg-[var(--z-surface)] p-4", children: [_jsx("h3", { className: "text-xs font-semibold uppercase tracking-wider text-[var(--z-muted)]", children: "Share links" }), canShare ? (_jsxs("div", { className: "mt-3 space-y-3", children: [_jsxs("label", { className: "block text-xs", children: [_jsx("span", { className: "mb-1 block text-[var(--z-muted)]", children: "Expires" }), _jsx("select", { value: expiresSeconds === null ? "" : String(expiresSeconds), onChange: (e) => {
                                    const v = e.target.value;
                                    setExpiresSeconds(v === "" ? null : Number(v));
                                }, className: "w-full rounded border border-[var(--z-border)] bg-[var(--z-bg)] px-2 py-1.5 text-xs text-[var(--z-fg)]", children: EXPIRY_PRESETS.map((p) => (_jsx("option", { value: p.seconds === null ? "" : String(p.seconds), children: p.label }, p.label))) })] }), _jsxs("label", { className: "flex items-center gap-2 text-xs text-[var(--z-fg)]", children: [_jsx("input", { type: "checkbox", checked: usePassword, onChange: (e) => setUsePassword(e.target.checked) }), "Require password"] }), usePassword ? (_jsxs("label", { className: "block text-xs", children: [_jsx("span", { className: "mb-1 block text-[var(--z-muted)]", children: "Password" }), _jsx("input", { type: "password", value: password, onChange: (e) => setPassword(e.target.value), autoComplete: "new-password", className: "w-full rounded border border-[var(--z-border)] bg-[var(--z-bg)] px-2 py-1.5 text-xs text-[var(--z-fg)]" })] })) : null, _jsxs("label", { className: "block text-xs", children: [_jsx("span", { className: "mb-1 block text-[var(--z-muted)]", children: "Max views (optional)" }), _jsx("input", { type: "number", min: "0", value: maxViews, onChange: (e) => setMaxViews(e.target.value), className: "w-full rounded border border-[var(--z-border)] bg-[var(--z-bg)] px-2 py-1.5 text-xs text-[var(--z-fg)]" })] }), _jsxs("label", { className: "flex items-center gap-2 text-xs text-[var(--z-fg)]", children: [_jsx("input", { type: "checkbox", checked: allowDownload, onChange: (e) => setAllowDownload(e.target.checked) }), "Allow download"] }), _jsxs("label", { className: "flex items-center gap-2 text-xs text-[var(--z-fg)]", children: [_jsx("input", { type: "checkbox", checked: watermarkPreview, onChange: (e) => setWatermarkPreview(e.target.checked) }), "Watermark preview (metadata flag)"] }), _jsx("button", { type: "button", onClick: createLink, disabled: busy, className: "w-full rounded-md bg-[var(--z-accent)] px-3 py-1.5 text-xs font-semibold text-black hover:opacity-90 disabled:opacity-50", children: "Create share link" }), error ? _jsx("div", { className: "text-xs text-red-400", children: error }) : null] })) : null, _jsxs("ul", { className: "mt-3 space-y-2", children: [shareLinks.length === 0 ? (_jsx("li", { className: "text-xs text-[var(--z-muted)]", children: "No active share links." })) : null, shareLinks.map((link) => {
                        var _a, _b;
                        return (_jsxs("li", { className: "flex items-center justify-between gap-2 rounded border border-[var(--z-border)] p-2 text-xs", children: [_jsxs("div", { className: "min-w-0", children: [_jsx("div", { className: "truncate text-[var(--z-fg)]", children: buildUrl(link.token) }), _jsxs("div", { className: "mt-0.5 text-[var(--z-muted)]", children: [link.status, " \u00B7 ", link.viewCount, " views", ((_a = link.metadata) === null || _a === void 0 ? void 0 : _a.watermarkPreview) ? " · watermarked" : "", link.expiresAt
                                                    ? ` · expires ${new Date(link.expiresAt).toLocaleString()}`
                                                    : ""] })] }), _jsx("div", { className: "flex shrink-0 flex-col items-end gap-1", children: _jsxs("div", { className: "flex flex-wrap justify-end gap-1", children: [_jsx("button", { type: "button", onClick: () => copyLink(link), className: "rounded border border-[var(--z-border)] px-2 py-1 text-[var(--z-fg)] hover:bg-white/[0.04]", children: copiedId === link.id ? "Copied" : "Copy" }), canShare ? (_jsxs(_Fragment, { children: [_jsx("button", { type: "button", onClick: () => {
                                                            setEmailLink(buildUrl(link.token));
                                                            setEmailOpen(true);
                                                        }, className: "rounded border border-[var(--z-border)] px-2 py-1 text-[var(--z-fg)] hover:bg-white/[0.04]", children: "Email" }), _jsx("button", { type: "button", onClick: () => { var _a; return void setDisabled(link, !((_a = link.metadata) === null || _a === void 0 ? void 0 : _a.linkDisabled)); }, className: "rounded border border-[var(--z-border)] px-2 py-1 text-[var(--z-fg)] hover:bg-white/[0.04]", children: ((_b = link.metadata) === null || _b === void 0 ? void 0 : _b.linkDisabled) ? "Enable" : "Disable" }), _jsx("button", { type: "button", onClick: () => revoke(link.id), className: "rounded border border-red-500/40 px-2 py-1 text-red-400 hover:bg-red-500/10", children: "Revoke" })] })) : null] }) })] }, link.id));
                    })] }), emailOpen ? (_jsx("div", { className: "fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4", children: _jsxs("div", { className: "w-full max-w-md rounded-lg border border-[var(--z-border)] bg-[var(--z-surface)] p-5 shadow-xl", children: [_jsx("h4", { className: "text-sm font-semibold text-[var(--z-fg)]", children: "Share via email" }), _jsx("p", { className: "mt-1 text-xs text-[var(--z-muted)]", children: "Opens your mail client with a pre-filled message. For tracked threads, start a conversation from Inbox and paste this link." }), _jsxs("label", { className: "mt-3 block text-xs", children: [_jsx("span", { className: "mb-1 block text-[var(--z-muted)]", children: "Recipient" }), _jsx("input", { value: emailTo, onChange: (e) => setEmailTo(e.target.value), type: "email", className: "w-full rounded border border-[var(--z-border)] bg-[var(--z-bg)] px-2 py-1.5 text-xs", placeholder: "name@example.com" })] }), _jsxs("div", { className: "mt-4 flex justify-end gap-2", children: [_jsx("button", { type: "button", className: "rounded border border-[var(--z-border)] px-3 py-1.5 text-xs", onClick: () => setEmailOpen(false), children: "Cancel" }), _jsx("a", { href: emailTo.trim()
                                        ? `mailto:${emailTo.trim()}?subject=${encodeURIComponent("Shared file link")}&body=${encodeURIComponent(`Here is the link:\n${emailLink}`)}`
                                        : "#", className: "rounded bg-[var(--z-accent)] px-3 py-1.5 text-xs font-semibold text-black", onClick: () => setEmailOpen(false), children: "Open mail" })] })] }) })) : null] }));
}
