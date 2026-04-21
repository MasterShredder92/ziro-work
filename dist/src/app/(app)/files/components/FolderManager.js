"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { showFilesToast } from "./filesToast";
export function FolderManager({ folders, canWrite }) {
    const router = useRouter();
    const [localFolders, setLocalFolders] = useState(folders);
    const [name, setName] = useState("");
    const [parentId, setParentId] = useState("");
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState(null);
    useEffect(() => {
        setLocalFolders(folders);
    }, [folders]);
    const createFolder = async () => {
        if (!name.trim()) {
            setError("Folder name is required");
            return;
        }
        setBusy(true);
        setError(null);
        const optimisticId = `temp-${Date.now()}`;
        const trimmed = name.trim();
        setLocalFolders((prev) => [
            ...prev,
            {
                id: optimisticId,
                tenantId: "",
                parentId: parentId || null,
                name: trimmed,
                description: null,
                path: trimmed,
                ownerId: null,
                visibility: "tenant",
                acl: [],
                metadata: {},
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                createdBy: null,
                updatedBy: null,
            },
        ]);
        setName("");
        setParentId("");
        try {
            const res = await fetch("/api/files/folders", {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({ name: trimmed, parentId: parentId || null }),
            });
            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error((data === null || data === void 0 ? void 0 : data.error) || `Create failed (${res.status})`);
            }
            const data = await res.json();
            const created = data === null || data === void 0 ? void 0 : data.data;
            if (created) {
                setLocalFolders((prev) => prev
                    .filter((f) => f.id !== optimisticId)
                    .concat(created)
                    .sort((a, b) => (a.path || a.name).localeCompare(b.path || b.name)));
            }
            showFilesToast("Folder created.", "success");
            router.refresh();
        }
        catch (err) {
            setLocalFolders((prev) => prev.filter((f) => f.id !== optimisticId));
            setError(err instanceof Error ? err.message : String(err));
        }
        finally {
            setBusy(false);
        }
    };
    const deleteFolder = async (id) => {
        if (!window.confirm("Delete this folder? Files inside will be orphaned."))
            return;
        const prevSnap = localFolders;
        setLocalFolders((cur) => cur.filter((f) => f.id !== id));
        setBusy(true);
        try {
            const res = await fetch(`/api/files/folders/${id}`, { method: "DELETE" });
            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error((data === null || data === void 0 ? void 0 : data.error) || `Delete failed (${res.status})`);
            }
            showFilesToast("Folder deleted.", "success");
            router.refresh();
        }
        catch (err) {
            setLocalFolders(prevSnap);
            setError(err instanceof Error ? err.message : String(err));
        }
        finally {
            setBusy(false);
        }
    };
    const renameFolder = async (f) => {
        const next = window.prompt("New folder name", f.name);
        if (!next || next === f.name)
            return;
        const prevSnap = localFolders;
        setLocalFolders((cur) => cur.map((x) => (x.id === f.id ? Object.assign(Object.assign({}, x), { name: next, path: next }) : x)));
        setBusy(true);
        try {
            const res = await fetch(`/api/files/folders/${f.id}`, {
                method: "PATCH",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({ name: next }),
            });
            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error((data === null || data === void 0 ? void 0 : data.error) || `Rename failed (${res.status})`);
            }
            const data = await res.json();
            const updated = data === null || data === void 0 ? void 0 : data.data;
            if (updated) {
                setLocalFolders((cur) => cur.map((x) => (x.id === f.id ? updated : x)));
            }
            showFilesToast("Folder renamed.", "success");
            router.refresh();
        }
        catch (err) {
            setLocalFolders(prevSnap);
            setError(err instanceof Error ? err.message : String(err));
        }
        finally {
            setBusy(false);
        }
    };
    return (_jsxs("div", { className: "space-y-4", children: [canWrite ? (_jsxs("div", { className: "rounded-md border border-[var(--z-border)] bg-[var(--z-surface)] p-4", children: [_jsx("h3", { className: "text-sm font-semibold text-[var(--z-fg)]", children: "New folder" }), _jsxs("div", { className: "mt-3 flex flex-col gap-2 md:flex-row", children: [_jsx("input", { value: name, onChange: (e) => setName(e.target.value), placeholder: "Folder name", className: "flex-1 rounded-md border border-[var(--z-border)] bg-[var(--z-bg)] px-3 py-2 text-sm text-[var(--z-fg)]" }), _jsxs("select", { value: parentId, onChange: (e) => setParentId(e.target.value), className: "rounded-md border border-[var(--z-border)] bg-[var(--z-bg)] px-3 py-2 text-sm text-[var(--z-fg)]", children: [_jsx("option", { value: "", children: "(root)" }), localFolders.map((f) => (_jsx("option", { value: f.id, children: f.path || f.name }, f.id)))] }), _jsx("button", { type: "button", onClick: createFolder, disabled: busy, className: "rounded-md bg-[var(--z-accent)] px-3 py-2 text-sm font-semibold text-black hover:opacity-90 disabled:opacity-50", children: "Create" })] }), error ? (_jsx("div", { className: "mt-2 text-xs text-red-400", children: error })) : null] })) : null, _jsx("div", { className: "overflow-hidden rounded-md border border-[var(--z-border)] bg-[var(--z-surface)]", children: _jsxs("table", { className: "w-full text-sm", children: [_jsx("thead", { className: "bg-white/[0.02] text-left text-xs uppercase tracking-wider text-[var(--z-muted)]", children: _jsxs("tr", { children: [_jsx("th", { className: "px-4 py-3 font-medium", children: "Name" }), _jsx("th", { className: "px-4 py-3 font-medium", children: "Path" }), _jsx("th", { className: "px-4 py-3 font-medium", children: "Visibility" }), canWrite ? _jsx("th", { className: "px-4 py-3" }) : null] }) }), _jsxs("tbody", { className: "divide-y divide-[var(--z-border)]", children: [localFolders.length === 0 ? (_jsx("tr", { children: _jsx("td", { colSpan: canWrite ? 4 : 3, className: "px-4 py-6 text-center text-sm text-[var(--z-muted)]", children: "No folders yet." }) })) : null, localFolders.map((f) => (_jsxs("tr", { children: [_jsx("td", { className: "px-4 py-3 font-medium text-[var(--z-fg)]", children: f.name }), _jsx("td", { className: "px-4 py-3 text-xs text-[var(--z-muted)]", children: f.path }), _jsx("td", { className: "px-4 py-3 text-xs text-[var(--z-muted)]", children: f.visibility }), canWrite ? (_jsxs("td", { className: "px-4 py-3 text-right", children: [_jsx("button", { type: "button", onClick: () => renameFolder(f), className: "mr-2 text-xs text-[var(--z-accent)] hover:underline", children: "Rename" }), _jsx("button", { type: "button", onClick: () => deleteFolder(f.id), className: "text-xs text-red-400 hover:underline", children: "Delete" })] })) : null] }, f.id)))] })] }) })] }));
}
