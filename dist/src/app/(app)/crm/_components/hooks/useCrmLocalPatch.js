"use client";
import { useCallback, useEffect, useId, useRef } from "react";
const CRM_LOCAL_PATCH_EVENT = "crm:local-patch";
export function useCrmLocalPatch(resource, onLocalPatch) {
    const sourceId = useId();
    const sourceRef = useRef(`crm-local-patch-${sourceId}`);
    useEffect(() => {
        const listener = (event) => {
            const custom = event;
            const detail = custom.detail;
            if (!detail || detail.source === sourceRef.current)
                return;
            if (detail.resource !== resource)
                return;
            onLocalPatch(detail.rowId, detail.patch);
        };
        window.addEventListener(CRM_LOCAL_PATCH_EVENT, listener);
        return () => window.removeEventListener(CRM_LOCAL_PATCH_EVENT, listener);
    }, [onLocalPatch, resource]);
    const emitLocalPatch = useCallback((rowId, patch) => {
        window.dispatchEvent(new CustomEvent(CRM_LOCAL_PATCH_EVENT, {
            detail: {
                resource,
                rowId,
                patch,
                source: sourceRef.current,
            },
        }));
    }, [resource]);
    return { emitLocalPatch };
}
