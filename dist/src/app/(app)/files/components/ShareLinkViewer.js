"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { FilePreview } from "./previews/FilePreview";
function classify403Message(msg) {
    const m = msg.toLowerCase();
    if (m.includes("password"))
        return "password";
    if (m.includes("expired"))
        return "expired";
    if (m.includes("view limit") || m.includes("max view"))
        return "limit";
    return "other";
}
export function ShareLinkViewer({ token }) {
    var _a, _b, _c, _d, _e, _f, _g;
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(true);
    const [needsPassword, setNeedsPassword] = useState(false);
    const [error, setError] = useState(null);
    const [errorKind, setErrorKind] = useState(null);
    const [data, setData] = useState(null);
    const load = async (pw) => {
        var _a, _b;
        setLoading(true);
        setError(null);
        setErrorKind(null);
        try {
            const qs = pw ? `?password=${encodeURIComponent(pw)}` : "";
            const res = await fetch(`/api/files/share/${token}${qs}`);
            if (res.status === 404) {
                setErrorKind("not_found");
                setError("This link is invalid, was revoked, or the file is no longer shared.");
                setData(null);
                return;
            }
            if (res.status === 403) {
                const body = await res.json().catch(() => ({}));
                const msg = String((_a = body === null || body === void 0 ? void 0 : body.error) !== null && _a !== void 0 ? _a : "Forbidden");
                const kind = classify403Message(msg);
                if (kind === "password") {
                    setNeedsPassword(true);
                    return;
                }
                if (kind === "expired") {
                    setErrorKind("expired");
                    setError("This link has expired. Ask the sender for a new link or an updated invitation.");
                    return;
                }
                if (kind === "limit") {
                    setErrorKind("limit");
                    setError("This link has reached its maximum number of views. Request a new link from the owner.");
                    return;
                }
                setErrorKind("forbidden");
                setError(msg.replace(/^FORBIDDEN:\s*/i, "") || "Access denied.");
                return;
            }
            if (!res.ok) {
                const body = await res.json().catch(() => ({}));
                setErrorKind("generic");
                setError((body === null || body === void 0 ? void 0 : body.error) || `Error ${res.status}`);
                return;
            }
            const body = await res.json();
            setData((_b = body.data) !== null && _b !== void 0 ? _b : null);
            setNeedsPassword(false);
        }
        catch (err) {
            setErrorKind("generic");
            setError(err instanceof Error ? err.message : String(err));
        }
        finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        void load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token]);
    if (loading && !data && !error && !needsPassword) {
        return (_jsx("div", { className: "p-10 text-center text-sm text-[var(--z-muted)]", role: "status", children: "Loading\u2026" }));
    }
    if (needsPassword) {
        return (_jsxs("div", { className: "mx-auto max-w-sm rounded-md border border-[var(--z-border)] bg-[var(--z-surface)] p-5", children: [_jsx("h2", { className: "text-base font-semibold text-[var(--z-fg)]", children: "Password required" }), _jsx("p", { className: "mt-1 text-xs text-[var(--z-muted)]", children: "Enter the password you received with this link to view the document." }), _jsx("input", { type: "password", value: password, onChange: (e) => setPassword(e.target.value), className: "mt-3 w-full rounded-md border border-[var(--z-border)] bg-[var(--z-bg)] px-3 py-2 text-sm text-[var(--z-fg)]" }), _jsx("button", { type: "button", onClick: () => load(password), className: "mt-3 w-full rounded-md bg-[var(--z-accent)] px-3 py-2 text-sm font-semibold text-black hover:opacity-90", children: "Unlock" }), error ? _jsx("div", { className: "mt-2 text-xs text-red-400", children: error }) : null] }));
    }
    if (error) {
        const title = errorKind === "not_found"
            ? "Link not available"
            : errorKind === "expired"
                ? "Link expired"
                : errorKind === "limit"
                    ? "View limit reached"
                    : errorKind === "forbidden"
                        ? "Access denied"
                        : "Something went wrong";
        return (_jsxs("div", { className: "mx-auto max-w-md space-y-3 rounded-md border border-red-500/35 bg-red-500/10 p-6 text-sm text-red-100", children: [_jsx("h2", { className: "text-base font-semibold text-red-50", children: title }), _jsx("p", { className: "text-xs leading-relaxed text-red-100/95", children: error }), errorKind === "expired" || errorKind === "limit" ? (_jsx("p", { className: "text-[11px] text-red-200/90", children: "Tip: expired and capped links are controlled by the owner \u2014 they can create a fresh link from Files \u2192 Share links." })) : null] }));
    }
    if (!data)
        return null;
    return (_jsxs("div", { className: "space-y-4", children: [_jsxs("header", { children: [_jsx("div", { className: "text-xs uppercase tracking-wider text-[var(--z-muted)]", children: "Shared file" }), _jsx("h1", { className: "text-xl font-semibold text-[var(--z-fg)]", children: (_d = (_b = (_a = data.file) === null || _a === void 0 ? void 0 : _a.name) !== null && _b !== void 0 ? _b : (_c = data.folder) === null || _c === void 0 ? void 0 : _c.name) !== null && _d !== void 0 ? _d : "Shared content" }), _jsxs("p", { className: "mt-1 text-xs text-[var(--z-muted)]", children: [data.link.viewCount, " view", data.link.viewCount === 1 ? "" : "s", data.link.maxViews != null ? ` · max ${data.link.maxViews}` : ""] })] }), ((_e = data.signedUrl) === null || _e === void 0 ? void 0 : _e.url) ? (_jsx(FilePreview, { url: data.signedUrl.url, mimeType: data.signedUrl.mimeType, name: data.signedUrl.fileName })) : (_jsx("div", { className: "rounded-md border border-[var(--z-border)] bg-[var(--z-surface)] p-6 text-sm text-[var(--z-muted)]", children: "This link points to a folder or is awaiting content." })), ((_f = data.signedUrl) === null || _f === void 0 ? void 0 : _f.url) && data.link.allowDownload ? (_jsx("a", { href: data.signedUrl.url, target: "_blank", rel: "noreferrer", download: (_g = data.file) === null || _g === void 0 ? void 0 : _g.name, className: "inline-flex rounded-md border border-[var(--z-border)] px-3 py-1.5 text-xs text-[var(--z-fg)] hover:bg-white/[0.04]", children: "Download" })) : null] }));
}
