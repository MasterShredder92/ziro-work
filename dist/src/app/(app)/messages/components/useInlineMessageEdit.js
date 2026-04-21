"use client";
import { useCallback, useMemo, useState } from "react";
import { updateMessageAction } from "../actions/updateMessageAction";
import { showMessagingToast } from "./messagingToast";
export function useInlineMessageEdit({ onOptimisticUpdate, onRevert, onSaved, }) {
    const [editingMessageId, setEditingMessageId] = useState(null);
    const [draft, setDraft] = useState("");
    const [original, setOriginal] = useState("");
    const [isSaving, setIsSaving] = useState(false);
    const startEditing = useCallback((messageId, initialText) => {
        if (isSaving)
            return;
        setEditingMessageId(messageId);
        setDraft(initialText);
        setOriginal(initialText);
    }, [isSaving]);
    const cancelEditing = useCallback(() => {
        if (isSaving)
            return;
        setEditingMessageId(null);
        setDraft("");
        setOriginal("");
    }, [isSaving]);
    const commitEditing = useCallback(async () => {
        if (!editingMessageId || isSaving)
            return false;
        if (draft === original) {
            cancelEditing();
            return false;
        }
        const nextBody = draft.trim();
        if (!nextBody) {
            showMessagingToast("Message body cannot be empty.", "error");
            return false;
        }
        const messageId = editingMessageId;
        const previousBody = original;
        onOptimisticUpdate(messageId, nextBody);
        setIsSaving(true);
        try {
            const updated = await updateMessageAction(messageId, { body: nextBody });
            onSaved(updated);
            cancelEditing();
            return true;
        }
        catch (error) {
            onRevert(messageId, previousBody);
            showMessagingToast(error instanceof Error ? error.message : "Failed to update message.", "error");
            return false;
        }
        finally {
            setIsSaving(false);
        }
    }, [
        cancelEditing,
        draft,
        editingMessageId,
        isSaving,
        onOptimisticUpdate,
        onRevert,
        onSaved,
        original,
    ]);
    const bindInputProps = useCallback(() => {
        return {
            value: draft,
            onChange: (event) => setDraft(event.target.value),
            onBlur: () => {
                if (!isSaving)
                    void commitEditing();
            },
            onKeyDown: (event) => {
                if (event.key === "Escape") {
                    event.preventDefault();
                    cancelEditing();
                    return;
                }
                if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    void commitEditing();
                }
            },
        };
    }, [cancelEditing, commitEditing, draft, isSaving]);
    return useMemo(() => ({
        editingMessageId,
        draft,
        original,
        isSaving,
        startEditing,
        cancelEditing,
        commitEditing,
        bindInputProps,
    }), [
        bindInputProps,
        cancelEditing,
        commitEditing,
        draft,
        editingMessageId,
        isSaving,
        original,
        startEditing,
    ]);
}
