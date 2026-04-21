"use client";

import * as React from "react";
import { getBrowserSupabaseClient } from "@/lib/supabase.browser";
import { useTenantUi } from "@/components/tenant/TenantUiContext";

export type OperatorSessionState = {
  activeLocationId: string | null;
  activeDate: string | null;
  activeView: "schedule" | "rooms";
  activeModal: "sub" | "callout" | "virtual" | "none";
  focusedBlockId: string | null;
};

export function useOperatorSession(state: OperatorSessionState) {
  const { tenantId } = useTenantUi();
  const supabase = getBrowserSupabaseClient();
  const [userId, setUserId] = React.useState<string | null>(null);
  const lastSyncRef = React.useRef<string>("");

  // Get current user ID
  React.useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setUserId(user.id);
    };
    void getUser();
  }, [supabase]);

  // Sync state to Supabase
  const syncState = React.useCallback(async (currentState: OperatorSessionState) => {
    if (!userId || !tenantId) return;

    const payload = {
      tenant_id: tenantId,
      user_id: userId,
      active_location_id: currentState.activeLocationId,
      active_date: currentState.activeDate,
      active_view: currentState.activeView,
      active_modal: currentState.activeModal,
      focused_block_id: currentState.focusedBlockId,
    };

    // Prevent redundant syncs by comparing stringified payload
    const syncKey = JSON.stringify(payload);
    if (syncKey === lastSyncRef.current) return;
    lastSyncRef.current = syncKey;

    const { error } = await supabase
      .from("operator_sessions")
      .upsert({ ...payload, updated_at: new Date().toISOString() }, { onConflict: "tenant_id,user_id" });

    if (error) {
      console.error("[OperatorSession] Sync failed:", error);
    }
  }, [supabase, tenantId, userId]);

  // Effect to sync on state changes
  React.useEffect(() => {
    if (userId && tenantId) {
      void syncState(state);
    }
  }, [state, syncState, tenantId, userId]);

  return { syncState };
}
