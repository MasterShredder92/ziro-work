"use client";

import * as React from "react";
import { useTenantUi } from "@/components/tenant/TenantUiContext";
import {
  resolveDomainActionSpec,
  type DomainActionSpec,
} from "@/lib/agentOS/domainActions";
import { useAgentOS } from "./AgentOSContext";
import type { QuickAction } from "@/lib/agentOS/pageIntelligence";

type AgentActionEvent = {
  agentId?: string;
  action?: QuickAction;
  source?: string;
};

async function executeSpec(spec: DomainActionSpec): Promise<unknown> {
  async function runRequest(
    method: "POST" | "PATCH",
    path: string,
    body?: Record<string, unknown>,
  ): Promise<Record<string, unknown>> {
    const response = await fetch(path, {
      method,
      headers: { "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
    const text = await response.text();
    let parsed: Record<string, unknown> = {};
    if (text) {
      try {
        parsed = JSON.parse(text) as Record<string, unknown>;
      } catch {
        parsed = { raw: text };
      }
    }
    if (!response.ok) {
      const msg = typeof parsed.error === "string"
        ? parsed.error
        : typeof parsed.raw === "string" && parsed.raw.length > 0
          ? parsed.raw
        : `${response.status} ${response.statusText}`;
      throw new Error(msg);
    }
    return parsed;
  }

  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 12000);
  try {
    const parsed = await runRequest(spec.request.method, spec.request.path, spec.request.body);
    if (spec.followup) {
      const threadId =
        parsed?.data && typeof parsed.data === "object"
          ? (parsed.data as { id?: unknown }).id
          : undefined;
      if (!threadId || typeof threadId !== "string") {
        throw new Error("Unable to resolve thread id for follow-up action.");
      }
      const followupPath = spec.followup.pathTemplate.replace("{threadId}", threadId);
      return await runRequest(spec.followup.method, followupPath, spec.followup.body);
    }
    return parsed;
  } catch (err) {
    if ((err as { name?: string }).name === "AbortError") {
      throw new Error("Timed out while performing domain action.");
    }
    throw err;
  } finally {
    window.clearTimeout(timeout);
  }
}

export function AgentDomainActionBridge() {
  const { tenantId } = useTenantUi();
  const { pathname, recordEvent, signalAlert } = useAgentOS();
  const activeRef = React.useRef<Set<string>>(new Set());

  React.useEffect(() => {
    const onAgentAction = (ev: Event) => {
      const detail = (ev as CustomEvent<AgentActionEvent>).detail;
      const action = detail?.action;
      if (!action) return;
      const spec = resolveDomainActionSpec({ action, pathname, tenantId });
      if (!spec) return;
      const lockId = `${spec.kind}:${spec.request.path}`;
      if (activeRef.current.has(lockId)) return;
      activeRef.current.add(lockId);
      recordEvent({
        actionId: action.id,
        label: action.label,
        detail: `Executing ${spec.kind}`,
      });
      void executeSpec(spec)
        .then(() => {
          recordEvent({
            actionId: action.id,
            label: action.label,
            level: "success",
            detail: spec.detail,
          });
        })
        .catch((err) => {
          const message = err instanceof Error ? err.message : String(err);
          signalAlert(message);
          recordEvent({
            actionId: action.id,
            label: action.label,
            level: "error",
            detail: `Failed: ${message}`,
          });
        })
        .finally(() => {
          activeRef.current.delete(lockId);
        });
    };

    window.addEventListener("ziro:agent-action", onAgentAction as EventListener);
    return () => {
      window.removeEventListener("ziro:agent-action", onAgentAction as EventListener);
    };
  }, [pathname, recordEvent, signalAlert, tenantId]);

  return null;
}
