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

export function useOperatorSession(initialState: OperatorSessionState) {
  const { tenantId } = useTenantUi();
  const supabase = getBrowserSupabaseClient();
  const [userId, setUserId] = React.useState<string | null>(null);

  // Get current user ID
  React.useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setUserId(user.id);
    };
    void getUser();
  }, [supabase]);

  // Sync state to Supabase
  const syncState = React.useCallback(async (state: Partial<OperatorSessionState>) => {
    if (!userId || !tenantId) return;

    const payload = {
      tenant_id: tenantId,
      user_id: userId,
      active_location_id: state.activeLocationId,
      active_date: state.activeDate,
      active_view: state.activeView,
      active_modal: state.activeModal,
      focused_block_id: state.focusedBlockId,
      updated_at: new Date().toISOString(),
    };

    // Filter out undefined values to avoid overwriting with null unless intended
    const cleanPayload = Object.fromEntries(
      Object.entries(payload).filter(([_, v]) => v !== undefined)
    );

    const { error } = await supabase
      .from("operator_sessions")
      .upsert(cleanPayload, { onConflict: "tenant_id,user_id" });

    if (error) {
      console.error("[OperatorSession] Sync failed:", error);
    }
  }, [supabase, tenantId, userId]);

  // Effect to sync on state changes
  React.useEffect(() => {
    if (userId && tenantId) {
      void syncState(initialState);
    }
  }, [initialState, syncState, tenantId, userId]);

  return { syncState };
}
