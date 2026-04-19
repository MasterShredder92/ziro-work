"use client";

import { useCallback, useEffect, useId, useRef } from "react";
import type { CrmInlineResource } from "../actions/updateCrmRow";

const CRM_LOCAL_PATCH_EVENT = "crm:local-patch";

type LocalPatchDetail = {
  resource: CrmInlineResource;
  rowId: string;
  patch: Record<string, unknown>;
  source: string;
};

export function useCrmLocalPatch(
  resource: CrmInlineResource,
  onLocalPatch: (rowId: string, patch: Record<string, unknown>) => void,
) {
  const sourceId = useId();
  const sourceRef = useRef(`crm-local-patch-${sourceId}`);

  useEffect(() => {
    const listener = (event: Event) => {
      const custom = event as CustomEvent<LocalPatchDetail>;
      const detail = custom.detail;
      if (!detail || detail.source === sourceRef.current) return;
      if (detail.resource !== resource) return;
      onLocalPatch(detail.rowId, detail.patch);
    };
    window.addEventListener(CRM_LOCAL_PATCH_EVENT, listener);
    return () => window.removeEventListener(CRM_LOCAL_PATCH_EVENT, listener);
  }, [onLocalPatch, resource]);

  const emitLocalPatch = useCallback(
    (rowId: string, patch: Record<string, unknown>) => {
      window.dispatchEvent(
        new CustomEvent<LocalPatchDetail>(CRM_LOCAL_PATCH_EVENT, {
          detail: {
            resource,
            rowId,
            patch,
            source: sourceRef.current,
          },
        }),
      );
    },
    [resource],
  );

  return { emitLocalPatch };
}
