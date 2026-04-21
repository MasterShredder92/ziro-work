"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { FilesBreadcrumbs } from "./FilesBreadcrumbs";
import { folderColorHex } from "./FolderColorPicker";
import { FilePreview } from "./previews/FilePreview";
import { FileUploadModal } from "./FileUploadModal";
import { ShareLinkManager } from "./ShareLinkManager";
import { VersionHistoryPanel } from "./VersionHistoryPanel";
import { showFilesToast } from "./filesToast";
function formatBytes(n) {
    if (!n)
        return "0 B";
    const units = ["B", "KB", "MB", "GB", "TB"];
    let idx = 0;
    let v = n;
    while (v >= 1024 && idx < units.length - 1) {
        v /= 1024;
        idx += 1;
    }
    return `${v.toFixed(v >= 10 || idx === 0 ? 0 : 1)} ${units[idx]}`;
}
export function FileDetailView({ surface, signedUrl, folders = [], }) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t;
    const router = useRouter();
    const { file, folder, versions, shareLinks, signatureRequests, permissions } = surface;
    const [uploadOpen, setUploadOpen] = useState(false);
    const [renameOpen, setRenameOpen] = useState(false);
    const [moveOpen, setMoveOpen] = useState(false);
    const [renameValue, setRenameValue] = useState(file.name);
    const [moveFolderId, setMoveFolderId] = useState((_a = file.folderId) !== null && _a !== void 0 ? _a : "");
    const [busy, setBusy] = useState(false);
    const [url, setUrl] = useState(signedUrl !== null && signedUrl !== void 0 ? signedUrl : null);
    useEffect(() => {
        var _a;
        setRenameValue(file.name);
        setMoveFolderId((_a = file.folderId) !== null && _a !== void 0 ? _a : "");
    }, [file.id, file.name, file.folderId]);
    useEffect(() => {
        if (!url && file.storageKey) {
            fetch(`/api/files/${file.id}?signedUrl=true`)
                .then((r) => (r.ok ? r.json() : null))
                .then((data) => {
                var _a;
                if ((_a = data === null || data === void 0 ? void 0 : data.data) === null || _a === void 0 ? void 0 : _a.signedUrl)
                    setUrl(data.data.signedUrl);
            })
                .catch(() => { });
        }
    }, [file.id, file.storageKey, url]);
    const crumbs = useMemo(() => {
        var _a;
        const items = [
            { label: "Files", href: "/files" },
            { label: "Explorer", href: "/files/explorer" },
        ];
        if (folder) {
            const fid = (_a = file.folderId) !== null && _a !== void 0 ? _a : folder.id;
            items.push({
                label: folder.path || folder.name,
                href: fid
                    ? `/files/explorer?folderId=${encodeURIComponent(fid)}`
                    : "/files/explorer",
                colorHex: folderColorHex(folder),
            });
        }
        items.push({ label: file.name });
        return items;
    }, [file.folderId, file.name, folder]);
    const onDelete = async () => {
        if (!permissions.canWrite) {
            showFilesToast("You do not have permission to delete this file.", "error");
            return;
        }
        if (!window.confirm(`Delete ${file.name}? This action cannot be undone.`))
            return;
        const res = await fetch(`/api/files/${file.id}`, { method: "DELETE" });
        if (res.ok) {
            showFilesToast("File deleted.", "success");
            router.push("/files");
            router.refresh();
        }
        else {
            const data = await res.json().catch(() => ({}));
            showFilesToast((data === null || data === void 0 ? void 0 : data.error) || "Delete failed", "error");
        }
    };
    const submitRename = async () => {
        if (!renameValue.trim() || renameValue === file.name) {
            setRenameOpen(false);
            return;
        }
        setBusy(true);
        try {
            const res = await fetch(`/api/files/${file.id}`, {
                method: "PATCH",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({ name: renameValue.trim() }),
            });
            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error((data === null || data === void 0 ? void 0 : data.error) || `Rename failed (${res.status})`);
            }
            showFilesToast("File renamed.", "success");
            setRenameOpen(false);
            router.refresh();
        }
        catch (e) {
            showFilesToast(e instanceof Error ? e.message : "Rename failed", "error");
        }
        finally {
            setBusy(false);
        }
    };
    const submitMove = async () => {
        var _a;
        const next = moveFolderId === "" ? null : moveFolderId;
        if (next === ((_a = file.folderId) !== null && _a !== void 0 ? _a : null)) {
            setMoveOpen(false);
            return;
        }
        setBusy(true);
        try {
            const res = await fetch(`/api/files/${file.id}`, {
                method: "PATCH",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({ folderId: next }),
            });
            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error((data === null || data === void 0 ? void 0 : data.error) || `Move failed (${res.status})`);
            }
            showFilesToast("File moved.", "success");
            setMoveOpen(false);
            router.refresh();
        }
        catch (e) {
            showFilesToast(e instanceof Error ? e.message : "Move failed", "error");
        }
        finally {
            setBusy(false);
        }
    };
    return (_jsxs("div", { className: "space-y-6", children: [_jsx(FilesBreadcrumbs, { items: crumbs }), _jsxs("header", { className: "flex flex-wrap items-start justify-between gap-3", children: [_jsxs("div", { children: [_jsx("div", { className: "text-xs uppercase tracking-wider text-[var(--z-muted)]", children: (_b = folder === null || folder === void 0 ? void 0 : folder.path) !== null && _b !== void 0 ? _b : "Files" }), _jsx("h1", { className: "text-2xl font-semibold text-[var(--z-fg)]", children: file.name }), file.description ? (_jsx("p", { className: "mt-1 max-w-2xl text-sm text-[var(--z-muted)]", children: file.description })) : null, ((_c = permissions.hints) === null || _c === void 0 ? void 0 : _c.read) ? (_jsx("p", { className: "mt-2 text-xs text-amber-200/90", children: permissions.hints.read })) : null] }), _jsxs("div", { className: "flex flex-wrap items-center gap-2", children: [(url === null || url === void 0 ? void 0 : url.url) ? (_jsx("a", { href: url.url, target: "_blank", rel: "noreferrer", download: file.name, className: "rounded-md border border-[var(--z-border)] px-3 py-1.5 text-xs text-[var(--z-fg)] hover:bg-white/[0.04]", children: "Download" })) : null, _jsx("button", { type: "button", onClick: () => setRenameOpen(true), disabled: !permissions.canWrite || file.status === "archived", title: !permissions.canWrite
                                    ? ((_e = (_d = permissions.hints) === null || _d === void 0 ? void 0 : _d.write) !== null && _e !== void 0 ? _e : undefined)
                                    : file.status === "archived"
                                        ? "Cannot rename an archived file"
                                        : undefined, className: "rounded-md border border-[var(--z-border)] px-3 py-1.5 text-xs text-[var(--z-fg)] hover:bg-white/[0.04] disabled:cursor-not-allowed disabled:opacity-40", children: "Rename" }), _jsx("button", { type: "button", onClick: () => setMoveOpen(true), disabled: !permissions.canWrite || file.status === "archived", title: !permissions.canWrite
                                    ? ((_g = (_f = permissions.hints) === null || _f === void 0 ? void 0 : _f.write) !== null && _g !== void 0 ? _g : undefined)
                                    : file.status === "archived"
                                        ? "Cannot move an archived file"
                                        : undefined, className: "rounded-md border border-[var(--z-border)] px-3 py-1.5 text-xs text-[var(--z-fg)] hover:bg-white/[0.04] disabled:cursor-not-allowed disabled:opacity-40", children: "Move" }), _jsx("button", { type: "button", onClick: () => setUploadOpen(true), disabled: !permissions.canWrite || file.status === "archived", title: !permissions.canWrite
                                    ? ((_j = (_h = permissions.hints) === null || _h === void 0 ? void 0 : _h.write) !== null && _j !== void 0 ? _j : undefined)
                                    : file.status === "archived"
                                        ? "Cannot upload versions to an archived file"
                                        : undefined, className: "rounded-md bg-[var(--z-accent)] px-3 py-1.5 text-xs font-semibold text-black hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40", children: "New version" }), permissions.canSign ? (_jsx(Link, { href: `/files/signatures/new?fileId=${file.id}`, className: "rounded-md border border-[var(--z-border)] px-3 py-1.5 text-xs text-[var(--z-fg)] hover:bg-white/[0.04]", children: "Request signature" })) : (_jsx("span", { className: "cursor-not-allowed rounded-md border border-[var(--z-border)] px-3 py-1.5 text-xs text-[var(--z-muted)] opacity-50", title: ((_k = permissions.hints) === null || _k === void 0 ? void 0 : _k.sign) ? permissions.hints.sign : "Signing not available", children: "Request signature" })), _jsx("button", { type: "button", onClick: onDelete, disabled: !permissions.canWrite, title: !permissions.canWrite ? ((_m = (_l = permissions.hints) === null || _l === void 0 ? void 0 : _l.write) !== null && _m !== void 0 ? _m : undefined) : undefined, className: "rounded-md border border-red-500/40 px-3 py-1.5 text-xs text-red-400 hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-40", children: "Delete" })] })] }), _jsxs("div", { className: "grid gap-6 lg:grid-cols-3", children: [_jsxs("div", { className: "space-y-4 lg:col-span-2", children: [_jsx(FilePreview, { url: (_o = url === null || url === void 0 ? void 0 : url.url) !== null && _o !== void 0 ? _o : null, mimeType: file.mimeType, name: file.name }), signatureRequests.length > 0 ? (_jsxs("section", { className: "space-y-2", children: [_jsx("h2", { className: "text-sm font-semibold uppercase tracking-wider text-[var(--z-muted)]", children: "Signature requests" }), _jsx("div", { className: "overflow-hidden rounded-md border border-[var(--z-border)] bg-[var(--z-surface)]", children: _jsxs("table", { className: "w-full text-sm", children: [_jsx("thead", { className: "bg-white/[0.02] text-left text-xs uppercase tracking-wider text-[var(--z-muted)]", children: _jsxs("tr", { children: [_jsx("th", { className: "px-3 py-2 font-medium", children: "Title" }), _jsx("th", { className: "px-3 py-2 font-medium", children: "Status" }), _jsx("th", { className: "px-3 py-2 font-medium", children: "Signers" })] }) }), _jsx("tbody", { className: "divide-y divide-[var(--z-border)]", children: signatureRequests.map((r) => (_jsxs("tr", { children: [_jsx("td", { className: "px-3 py-2", children: _jsx(Link, { href: `/files/signatures/${r.id}`, className: "font-medium text-[var(--z-accent)] hover:underline", children: r.title }) }), _jsx("td", { className: "px-3 py-2 text-xs text-[var(--z-muted)]", children: r.status }), _jsx("td", { className: "px-3 py-2 text-xs text-[var(--z-muted)]", children: r.signers.length })] }, r.id))) })] }) })] })) : null] }), _jsxs("aside", { className: "space-y-4 lg:border-l lg:border-[var(--z-border)] lg:pl-6", children: [_jsxs("div", { className: "rounded-md border border-[var(--z-border)] bg-[var(--z-surface)] p-4", children: [_jsx("h3", { className: "text-xs font-semibold uppercase tracking-wider text-[var(--z-muted)]", children: "Permissions" }), _jsxs("dl", { className: "mt-2 space-y-1 text-[11px] text-[var(--z-muted)]", children: [_jsx(PermRow, { label: "Read", ok: permissions.canRead, hint: (_p = permissions.hints) === null || _p === void 0 ? void 0 : _p.read }), _jsx(PermRow, { label: "Write", ok: permissions.canWrite, hint: (_q = permissions.hints) === null || _q === void 0 ? void 0 : _q.write }), _jsx(PermRow, { label: "Share", ok: permissions.canShare, hint: (_r = permissions.hints) === null || _r === void 0 ? void 0 : _r.share }), _jsx(PermRow, { label: "Sign", ok: permissions.canSign, hint: (_s = permissions.hints) === null || _s === void 0 ? void 0 : _s.sign })] })] }), _jsxs("div", { className: "rounded-md border border-[var(--z-border)] bg-[var(--z-surface)] p-4", children: [_jsx("h3", { className: "text-xs font-semibold uppercase tracking-wider text-[var(--z-muted)]", children: "Details" }), _jsxs("dl", { className: "mt-2 space-y-1 text-sm", children: [_jsx(Row, { label: "Type", value: file.mimeType }), _jsx(Row, { label: "Size", value: formatBytes(file.size) }), _jsx(Row, { label: "Visibility", value: file.visibility }), _jsx(Row, { label: "Status", value: file.status }), _jsx(Row, { label: "Scan", value: file.virusScanStatus }), _jsx(Row, { label: "Signature", value: (_t = file.signatureStatus) !== null && _t !== void 0 ? _t : "—" }), _jsx(Row, { label: "Created", value: new Date(file.createdAt).toLocaleString() }), _jsx(Row, { label: "Updated", value: new Date(file.updatedAt).toLocaleString() })] })] }), _jsxs("div", { className: "rounded-md border border-[var(--z-border)] bg-[var(--z-surface)] p-4", children: [_jsx("h3", { className: "text-xs font-semibold uppercase tracking-wider text-[var(--z-muted)]", children: "Version history" }), _jsx(VersionHistoryPanel, { file: file, fileId: file.id, versions: versions, currentVersionId: file.currentVersionId, canWrite: permissions.canWrite && file.status !== "archived", onVersionsChanged: () => {
                                            showFilesToast("Version updated.", "success");
                                            router.refresh();
                                        } })] }), _jsx(ShareLinkManager, { fileId: file.id, shareLinks: shareLinks, canShare: permissions.canShare })] })] }), _jsx(FileUploadModal, { open: uploadOpen, onClose: () => setUploadOpen(false), targetFileId: file.id }), renameOpen ? (_jsx("div", { className: "fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4", children: _jsxs("div", { className: "w-full max-w-md rounded-lg border border-[var(--z-border)] bg-[var(--z-surface)] p-5 shadow-xl", role: "dialog", "aria-modal": "true", "aria-labelledby": "rename-title", children: [_jsx("h2", { id: "rename-title", className: "text-base font-semibold text-[var(--z-fg)]", children: "Rename file" }), _jsx("input", { value: renameValue, onChange: (e) => setRenameValue(e.target.value), className: "mt-3 w-full rounded-md border border-[var(--z-border)] bg-[var(--z-bg)] px-3 py-2 text-sm text-[var(--z-fg)]" }), _jsxs("div", { className: "mt-4 flex justify-end gap-2", children: [_jsx("button", { type: "button", onClick: () => setRenameOpen(false), className: "rounded-md border border-[var(--z-border)] px-3 py-2 text-sm", children: "Cancel" }), _jsx("button", { type: "button", onClick: submitRename, disabled: busy, className: "rounded-md bg-[var(--z-accent)] px-3 py-2 text-sm font-semibold text-black disabled:opacity-50", children: "Save" })] })] }) })) : null, moveOpen ? (_jsx("div", { className: "fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4", children: _jsxs("div", { className: "w-full max-w-md rounded-lg border border-[var(--z-border)] bg-[var(--z-surface)] p-5 shadow-xl", role: "dialog", "aria-modal": "true", children: [_jsx("h2", { className: "text-base font-semibold text-[var(--z-fg)]", children: "Move to folder" }), _jsxs("select", { value: moveFolderId, onChange: (e) => setMoveFolderId(e.target.value), className: "mt-3 w-full rounded-md border border-[var(--z-border)] bg-[var(--z-bg)] px-3 py-2 text-sm text-[var(--z-fg)]", children: [_jsx("option", { value: "", children: "(root \u2014 no folder)" }), folders.map((f) => (_jsx("option", { value: f.id, disabled: f.id === file.folderId, children: f.path || f.name }, f.id)))] }), _jsxs("div", { className: "mt-4 flex justify-end gap-2", children: [_jsx("button", { type: "button", onClick: () => setMoveOpen(false), className: "rounded-md border border-[var(--z-border)] px-3 py-2 text-sm", children: "Cancel" }), _jsx("button", { type: "button", onClick: submitMove, disabled: busy, className: "rounded-md bg-[var(--z-accent)] px-3 py-2 text-sm font-semibold text-black disabled:opacity-50", children: "Move" })] })] }) })) : null] }));
}
function Row({ label, value }) {
    return (_jsxs("div", { className: "flex justify-between gap-2", children: [_jsx("dt", { className: "text-xs text-[var(--z-muted)]", children: label }), _jsx("dd", { className: "truncate text-right text-xs text-[var(--z-fg)]", children: value })] }));
}
function PermRow({ label, ok, hint, }) {
    return (_jsxs("div", { className: "flex flex-col gap-0.5", children: [_jsxs("div", { className: "flex justify-between gap-2", children: [_jsx("dt", { children: label }), _jsx("dd", { className: ok ? "text-emerald-300/90" : "text-amber-200/90", children: ok ? "Allowed" : "Blocked" })] }), !ok && hint ? (_jsx("dd", { className: "text-[10px] leading-snug text-[var(--z-muted)]", children: hint })) : null] }));
}
