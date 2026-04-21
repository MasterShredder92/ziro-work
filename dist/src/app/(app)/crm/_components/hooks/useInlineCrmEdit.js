"use client";
import { useCallback, useMemo, useState, } from "react";
import { updateCrmRowAction, } from "../actions/updateCrmRowAction";
export function useInlineCrmEdit({ resource, toPatch, onOptimisticUpdate, onRevert, }) {
    const [editingKey, setEditingKey] = useState(null);
    const [draftValue, setDraftValue] = useState("");
    const [originalValue, setOriginalValue] = useState("");
    const [isSaving, setIsSaving] = useState(false);
    const [toast, setToast] = useState(null);
    const startEditing = useCallback((rowId, columnKey, initialValue) => {
        if (isSaving)
            return;
        setEditingKey(`${rowId}:${columnKey}`);
        setDraftValue(initialValue);
        setOriginalValue(initialValue);
    }, [isSaving]);
    const cancelEditing = useCallback(() => {
        if (isSaving)
            return;
        setEditingKey(null);
        setDraftValue("");
        setOriginalValue("");
    }, [isSaving]);
    const commitEditing = useCallback(async () => {
        if (!editingKey || isSaving)
            return;
        const separatorIndex = editingKey.indexOf(":");
        if (separatorIndex < 0)
            return;
        const rowId = editingKey.slice(0, separatorIndex);
        const columnKey = editingKey.slice(separatorIndex + 1);
        if (draftValue === originalValue) {
            setEditingKey(null);
            setDraftValue("");
            setOriginalValue("");
            return;
        }
        const args = { rowId, columnKey, value: draftValue };
        onOptimisticUpdate(args);
        setIsSaving(true);
        try {
            await updateCrmRowAction(resource, rowId, toPatch(args));
            setEditingKey(null);
            setDraftValue("");
            setOriginalValue("");
        }
        catch (error) {
            onRevert(Object.assign(Object.assign({}, args), { value: originalValue }));
            setToast({
                id: Date.now(),
                message: error instanceof Error
                    ? error.message
                    : "Unable to save inline edit.",
            });
        }
        finally {
            setIsSaving(false);
        }
    }, [
        draftValue,
        editingKey,
        isSaving,
        onOptimisticUpdate,
        onRevert,
        originalValue,
        resource,
        toPatch,
    ]);
    const bindInputProps = useCallback((rowId, columnKey, label) => ({
        value: draftValue,
        onChange: (event) => setDraftValue(event.target.value),
        onBlur: () => {
            const key = `${rowId}:${columnKey}`;
            if (editingKey === key && !isSaving) {
                void commitEditing();
            }
        },
        onKeyDown: (event) => {
            if (event.key === "Enter") {
                event.preventDefault();
                void commitEditing();
                return;
            }
            if (event.key === "Escape") {
                event.preventDefault();
                cancelEditing();
            }
        },
        "aria-label": `Editing ${label}`,
        autoFocus: true,
        className: "h-8 w-full rounded border border-[var(--z-border,#1c1c1e)] bg-black px-2 text-sm text-[var(--z-fg,#f0f0f0)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--z-accent,#00ff88)]",
    }), [cancelEditing, commitEditing, draftValue, editingKey, isSaving]);
    const clearToast = useCallback(() => setToast(null), []);
    const isEditingCell = useCallback((rowId, columnKey) => editingKey === `${rowId}:${columnKey}`, [editingKey]);
    return useMemo(() => ({
        editingKey,
        draftValue,
        originalValue,
        isSaving,
        toast,
        setDraftValue,
        startEditing,
        cancelEditing,
        commitEditing,
        bindInputProps,
        clearToast,
        isEditingCell,
    }), [
        bindInputProps,
        cancelEditing,
        clearToast,
        commitEditing,
        draftValue,
        editingKey,
        isEditingCell,
        isSaving,
        originalValue,
        startEditing,
        toast,
    ]);
}
