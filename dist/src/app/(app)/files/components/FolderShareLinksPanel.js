"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useMemo, useState } from "react";
import { AccessLogsPanel } from "./AccessLogsPanel";
import { ShareLinkRow } from "./ShareLinkRow";
import { showFilesToast } from "./filesToast";
function shareUrl(token) {
    if (typeof window !== "undefined") {
        return `${window.location.origin}/files/share/${token}`;
    }
    return `/files/share/${token}`;
}
function mergeShareLinkPatch(link, patch) {
    var _a;
    const metadataPatch = patch.metadata && typeof patch.metadata === "object"
        ? patch.metadata
        : null;
    return Object.assign(Object.assign(Object.assign({}, link), patch), { metadata: metadataPatch ? Object.assign(Object.assign({}, ((_a = link.metadata) !== null && _a !== void 0 ? _a : {})), metadataPatch) : link.metadata });
}
export function FolderShareLinksPanel({ open, folderId, folderName, canShare = false, accessLogsLinkId = null, onAccessLogsLinkIdChange, onClose, }) {
    var _a, _b;
    const [links, setLinks] = useState([]);
    const [files, setFiles] = useState([]);
    const [busy, setBusy] = useState(false);
    const [createBusy, setCreateBusy] = useState(false);
    const [passwordEnabled, setPasswordEnabled] = useState(false);
    const [password, setPassword] = useState("");
    const [expiresDate, setExpiresDate] = useState("");
    const [error, setError] = useState(null);
    const [overrides, setOverrides] = useState({});
    const [creatingIds, setCreatingIds] = useState({});
    const folderLinks = useMemo(() => links.filter((link) => link.folderId === folderId), [links, folderId]);
    useEffect(() => {
        if (!open || !folderId)
            return;
        setOverrides({});
        setCreatingIds({});
        setBusy(true);
        setError(null);
        void fetch(`/api/files?folderId=${encodeURIComponent(folderId)}`, { method: "GET" })
            .then(async (res) => {
            var _a, _b, _c, _d;
            if (!res.ok)
                throw new Error(`Failed to load links (${res.status})`);
            const data = (await res.json());
            setLinks((_b = (_a = data.data) === null || _a === void 0 ? void 0 : _a.shareLinks) !== null && _b !== void 0 ? _b : []);
            setFiles((_d = (_c = data.data) === null || _c === void 0 ? void 0 : _c.files) !== null && _d !== void 0 ? _d : []);
        })
            .catch((err) => {
            const msg = err instanceof Error ? err.message : "Failed to load links";
            setError(msg);
        })
            .finally(() => setBusy(false));
    }, [open, folderId]);
    useEffect(() => {
        if (!open)
            return;
        const onKey = (event) => {
            if (event.key !== "Escape")
                return;
            if (accessLogsLinkId) {
                onAccessLogsLinkIdChange === null || onAccessLogsLinkIdChange === void 0 ? void 0 : onAccessLogsLinkIdChange(null);
                return;
            }
            onClose();
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [open, onClose, accessLogsLinkId, onAccessLogsLinkIdChange]);
    useEffect(() => {
        if (!open || !folderId || !accessLogsLinkId)
            return;
        const exists = folderLinks.some((link) => link.id === accessLogsLinkId);
        if (!exists)
            onAccessLogsLinkIdChange === null || onAccessLogsLinkIdChange === void 0 ? void 0 : onAccessLogsLinkIdChange(null);
    }, [open, folderId, accessLogsLinkId, folderLinks, onAccessLogsLinkIdChange]);
    const createLink = async () => {
        var _a;
        if (!folderId || !canShare)
            return;
        setCreateBusy(true);
        setError(null);
        const optimistic = {
            id: `temp-${Date.now()}`,
            tenantId: "",
            fileId: null,
            folderId,
            token: `creating-${Date.now()}`,
            status: "active",
            passwordHash: passwordEnabled && password ? "pending" : null,
            expiresAt: expiresDate ? new Date(`${expiresDate}T23:59:59.000Z`).toISOString() : null,
            maxViews: null,
            viewCount: 0,
            allowDownload: false,
            metadata: { permissionLevel: "view", linkDisabled: false, passwordEnabled },
            createdBy: null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
        setLinks((prev) => [optimistic, ...prev]);
        setCreatingIds((prev) => (Object.assign(Object.assign({}, prev), { [optimistic.id]: true })));
        try {
            const res = await fetch("/api/files/share", {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({
                    folderId,
                    password: passwordEnabled && password ? password : null,
                    expiresInSeconds: expiresDate
                        ? Math.max(1, Math.floor((new Date(`${expiresDate}T23:59:59.000Z`).getTime() - Date.now()) / 1000))
                        : null,
                    allowDownload: false,
                }),
            });
            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error((data === null || data === void 0 ? void 0 : data.error) || `Create failed (${res.status})`);
            }
            const data = (await res.json());
            const created = (_a = data.data) !== null && _a !== void 0 ? _a : optimistic;
            setLinks((prev) => [created, ...prev.filter((x) => x.id !== optimistic.id)]);
            setCreatingIds((prev) => {
                const next = Object.assign({}, prev);
                delete next[optimistic.id];
                if (created.id !== optimistic.id)
                    next[created.id] = true;
                return next;
            });
            window.setTimeout(() => {
                setCreatingIds((prev) => {
                    const next = Object.assign({}, prev);
                    delete next[created.id];
                    return next;
                });
            }, 500);
            setPassword("");
            setExpiresDate("");
            setPasswordEnabled(false);
            showFilesToast("Share link created.", "success");
        }
        catch (err) {
            setLinks((prev) => prev.filter((x) => x.id !== optimistic.id));
            setCreatingIds((prev) => {
                const next = Object.assign({}, prev);
                delete next[optimistic.id];
                return next;
            });
            const msg = err instanceof Error ? err.message : "Could not create share link";
            setError(msg);
            showFilesToast(msg, "error");
        }
        finally {
            setCreateBusy(false);
        }
    };
    const patchLink = async (id, patch) => {
        const res = await fetch("/api/files/share", {
            method: "PATCH",
            headers: { "content-type": "application/json" },
            body: JSON.stringify(Object.assign({ id }, patch)),
        });
        if (!res.ok) {
            const data = await res.json().catch(() => ({}));
            throw new Error((data === null || data === void 0 ? void 0 : data.error) || `Update failed (${res.status})`);
        }
        const data = (await res.json());
        if (data.data) {
            setLinks((prev) => prev.map((x) => (x.id === id ? data.data : x)));
        }
    };
    const getLinkPermission = (link) => {
        var _a, _b;
        const local = (_a = overrides[link.id]) === null || _a === void 0 ? void 0 : _a.permissionLevel;
        if (local)
            return local;
        const raw = (_b = link.metadata) === null || _b === void 0 ? void 0 : _b.permissionLevel;
        if (raw === "view" || raw === "upload" || raw === "view-upload")
            return raw;
        return "view";
    };
    const updateRow = async (linkId, patch) => {
        var _a, _b;
        const link = links.find((row) => row.id === linkId);
        if (!link)
            return;
        const previousLinks = links;
        const previousOverrides = overrides;
        const metadataPatch = patch.metadata && typeof patch.metadata === "object"
            ? patch.metadata
            : null;
        const nextPermissionRaw = metadataPatch === null || metadataPatch === void 0 ? void 0 : metadataPatch.permissionLevel;
        const nextPermission = nextPermissionRaw === "view" ||
            nextPermissionRaw === "upload" ||
            nextPermissionRaw === "view-upload"
            ? nextPermissionRaw
            : null;
        const nextPasswordEnabledRaw = metadataPatch === null || metadataPatch === void 0 ? void 0 : metadataPatch.passwordEnabled;
        const nextPasswordEnabled = typeof nextPasswordEnabledRaw === "boolean" ? nextPasswordEnabledRaw : null;
        const nextExpiresAt = Object.prototype.hasOwnProperty.call(patch, "expiresAt")
            ? ((_a = patch.expiresAt) !== null && _a !== void 0 ? _a : null)
            : undefined;
        const nextDisabledRaw = (_b = patch.linkDisabled) !== null && _b !== void 0 ? _b : metadataPatch === null || metadataPatch === void 0 ? void 0 : metadataPatch.linkDisabled;
        const nextDisabled = typeof nextDisabledRaw === "boolean" ? nextDisabledRaw : undefined;
        setOverrides((prev) => {
            var _a;
            return (Object.assign(Object.assign({}, prev), { [linkId]: Object.assign(Object.assign(Object.assign(Object.assign(Object.assign({}, ((_a = prev[linkId]) !== null && _a !== void 0 ? _a : {})), (nextPermission ? { permissionLevel: nextPermission } : {})), (nextExpiresAt !== undefined ? { expiresAt: nextExpiresAt } : {})), (nextDisabled !== undefined ? { disabled: nextDisabled } : {})), (nextPasswordEnabled !== null ? { passwordEnabled: nextPasswordEnabled } : {})) }));
        });
        setLinks((prev) => prev.map((row) => (row.id === linkId ? mergeShareLinkPatch(row, patch) : row)));
        try {
            await patchLink(linkId, patch);
        }
        catch (err) {
            setLinks(previousLinks);
            setOverrides(previousOverrides);
            throw err;
        }
    };
    const selectedLogs = useMemo(() => {
        var _a, _b, _c;
        if (!accessLogsLinkId)
            return [];
        const link = folderLinks.find((row) => row.id === accessLogsLinkId);
        const fromLink = (_a = link === null || link === void 0 ? void 0 : link.metadata) === null || _a === void 0 ? void 0 : _a.accessLogs;
        if (Array.isArray(fromLink)) {
            return fromLink.filter((x) => typeof x === "object" && x !== null);
        }
        const fallback = [];
        for (const file of files) {
            if (((_b = file.folderId) !== null && _b !== void 0 ? _b : null) !== (folderId !== null && folderId !== void 0 ? folderId : null))
                continue;
            const rawLogs = (_c = file.metadata) === null || _c === void 0 ? void 0 : _c.accessLogs;
            if (!Array.isArray(rawLogs))
                continue;
            for (const log of rawLogs) {
                if (!log || typeof log !== "object")
                    continue;
                const record = log;
                if (record.linkId && typeof record.linkId === "string" && record.linkId !== accessLogsLinkId) {
                    continue;
                }
                fallback.push({
                    timestamp: typeof record.timestamp === "string"
                        ? record.timestamp
                        : typeof record.at === "string"
                            ? record.at
                            : null,
                    ip: typeof record.ip === "string" ? record.ip : null,
                    userAgent: typeof record.userAgent === "string" ? record.userAgent : null,
                    fileName: file.name,
                    target: file.name,
                });
            }
        }
        return fallback;
    }, [accessLogsLinkId, folderLinks, files, folderId]);
    const removeLink = async (id) => {
        const previousLinks = links;
        const previousOverrides = overrides;
        setLinks((cur) => cur.filter((x) => x.id !== id));
        setOverrides((cur) => {
            const next = Object.assign({}, cur);
            delete next[id];
            return next;
        });
        try {
            const res = await fetch(`/api/files/share?id=${encodeURIComponent(id)}`, {
                method: "DELETE",
            });
            if (!res.ok)
                throw new Error(`Delete failed (${res.status})`);
            showFilesToast("Share link removed.", "success");
        }
        catch (err) {
            setLinks(previousLinks);
            setOverrides(previousOverrides);
            showFilesToast(err instanceof Error ? err.message : "Could not remove link", "error");
            throw err;
        }
    };
    if (!open)
        return null;
    return (_jsxs("div", { className: "fixed inset-0 z-[70] flex", role: "presentation", children: [_jsx("button", { type: "button", "aria-label": "Close share links panel", className: "flex-1 bg-black/45", onClick: onClose }), _jsxs("aside", { className: "h-full w-full max-w-full animate-[slideInRight_180ms_ease-out] border-l border-[var(--z-border)] bg-[var(--z-surface)] shadow-2xl md:w-96", children: [_jsxs("div", { className: "flex h-full flex-col", children: [_jsxs("div", { className: "flex items-center justify-between border-b border-[var(--z-border)] px-4 py-3", children: [_jsxs("div", { children: [_jsx("div", { className: "text-xs uppercase tracking-wider text-[var(--z-muted)]", children: "Folder share links" }), _jsx("div", { className: "text-sm font-semibold text-[var(--z-fg)]", children: folderName !== null && folderName !== void 0 ? folderName : "Folder" })] }), _jsx("button", { type: "button", className: "rounded border border-[var(--z-border)] px-2 py-1 text-xs text-[var(--z-muted)] hover:bg-white/[0.05] hover:text-[var(--z-fg)]", onClick: onClose, children: "Close" })] }), _jsxs("div", { className: "space-y-3 border-b border-[var(--z-border)] px-4 py-3", children: [_jsx("div", { className: "text-xs font-semibold uppercase tracking-wider text-[var(--z-muted)]", children: "Create link" }), _jsxs("label", { className: "flex items-center gap-2 text-xs text-[var(--z-fg)]", children: [_jsx("input", { type: "checkbox", checked: passwordEnabled, onChange: (e) => setPasswordEnabled(e.target.checked) }), "Password protect"] }), passwordEnabled ? (_jsx("input", { type: "password", value: password, onChange: (e) => setPassword(e.target.value), placeholder: "Password", autoComplete: "new-password", className: "w-full rounded border border-[var(--z-border)] bg-[var(--z-bg)] px-2 py-1.5 text-xs text-[var(--z-fg)]" })) : null, _jsxs("label", { className: "block text-xs", children: [_jsx("span", { className: "mb-1 block text-[var(--z-muted)]", children: "Expiration date" }), _jsx("input", { type: "date", value: expiresDate, onChange: (e) => setExpiresDate(e.target.value), className: "w-full rounded border border-[var(--z-border)] bg-[var(--z-bg)] px-2 py-1.5 text-xs text-[var(--z-fg)]" })] }), _jsx("button", { type: "button", disabled: !canShare || createBusy || !folderId, onClick: () => void createLink(), className: "w-full rounded bg-[var(--z-accent)] px-2 py-1.5 text-xs font-semibold text-black disabled:cursor-not-allowed disabled:opacity-50", children: createBusy ? "Creating..." : "Create new link" }), error ? _jsx("div", { className: "text-xs text-red-400", children: error }) : null] }), _jsxs("div", { className: "min-h-0 flex-1 overflow-y-auto px-4 py-3", children: [busy ? _jsx("div", { className: "text-xs text-[var(--z-muted)]", children: "Loading links..." }) : null, !busy && folderLinks.length === 0 ? (_jsx("div", { className: "rounded border border-dashed border-[var(--z-border)] px-3 py-6 text-center text-xs text-[var(--z-muted)]", children: "No share links yet" })) : null, _jsx("ul", { className: "space-y-2", children: folderLinks.map((link) => {
                                            var _a, _b, _c, _d, _e, _f;
                                            const rowOverrides = (_a = overrides[link.id]) !== null && _a !== void 0 ? _a : {};
                                            const permission = (_b = rowOverrides.permissionLevel) !== null && _b !== void 0 ? _b : getLinkPermission(link);
                                            const passwordEnabledValue = Boolean((_d = (_c = rowOverrides.passwordEnabled) !== null && _c !== void 0 ? _c : link.passwordHash) !== null && _d !== void 0 ? _d : (_e = link.metadata) === null || _e === void 0 ? void 0 : _e.passwordEnabled);
                                            const linkWithOverrides = Object.assign(Object.assign({}, link), { metadata: Object.assign(Object.assign({}, ((_f = link.metadata) !== null && _f !== void 0 ? _f : {})), { permissionLevel: permission, passwordEnabled: passwordEnabledValue }) });
                                            return (_jsx(ShareLinkRow, { link: linkWithOverrides, permissionOverride: permission, expirationOverride: rowOverrides.expiresAt, disabledOverride: rowOverrides.disabled, passwordEnabledOverride: rowOverrides.passwordEnabled, onUpdate: updateRow, onDelete: removeLink, onOpenLogs: (targetId) => onAccessLogsLinkIdChange === null || onAccessLogsLinkIdChange === void 0 ? void 0 : onAccessLogsLinkIdChange(targetId), isCreating: Boolean(creatingIds[link.id]) }, link.id));
                                        }) })] })] }), _jsx(AccessLogsPanel, { open: accessLogsLinkId != null, linkLabel: accessLogsLinkId
                            ? shareUrl((_b = (_a = folderLinks.find((row) => row.id === accessLogsLinkId)) === null || _a === void 0 ? void 0 : _a.token) !== null && _b !== void 0 ? _b : "")
                            : "Share link", logs: selectedLogs, onClose: () => onAccessLogsLinkIdChange === null || onAccessLogsLinkIdChange === void 0 ? void 0 : onAccessLogsLinkIdChange(null) })] })] }));
}
