"use client";
import * as React from "react";
import { useTenantUi } from "@/components/tenant/TenantUiContext";
import { resolveDomainActionSpec, } from "@/lib/agentOS/domainActions";
import { useAgentOS } from "./AgentOSContext";
async function executeSpec(spec) {
    async function runRequest(method, path, body) {
        const response = await fetch(path, {
            method,
            headers: { "Content-Type": "application/json" },
            body: body ? JSON.stringify(body) : undefined,
            signal: controller.signal,
        });
        const text = await response.text();
        let parsed = {};
        if (text) {
            try {
                parsed = JSON.parse(text);
            }
            catch (_a) {
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
            const threadId = (parsed === null || parsed === void 0 ? void 0 : parsed.data) && typeof parsed.data === "object"
                ? parsed.data.id
                : undefined;
            if (!threadId || typeof threadId !== "string") {
                throw new Error("Unable to resolve thread id for follow-up action.");
            }
            const followupPath = spec.followup.pathTemplate.replace("{threadId}", threadId);
            return await runRequest(spec.followup.method, followupPath, spec.followup.body);
        }
        return parsed;
    }
    catch (err) {
        if (err.name === "AbortError") {
            throw new Error("Timed out while performing domain action.");
        }
        throw err;
    }
    finally {
        window.clearTimeout(timeout);
    }
}
export function AgentDomainActionBridge() {
    const { tenantId } = useTenantUi();
    const { pathname, recordEvent, signalAlert } = useAgentOS();
    const activeRef = React.useRef(new Set());
    React.useEffect(() => {
        const onAgentAction = (ev) => {
            const detail = ev.detail;
            const action = detail === null || detail === void 0 ? void 0 : detail.action;
            if (!action)
                return;
            const spec = resolveDomainActionSpec({ action, pathname, tenantId });
            if (!spec)
                return;
            const lockId = `${spec.kind}:${spec.request.path}`;
            if (activeRef.current.has(lockId))
                return;
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
        window.addEventListener("ziro:agent-action", onAgentAction);
        return () => {
            window.removeEventListener("ziro:agent-action", onAgentAction);
        };
    }, [pathname, recordEvent, signalAlert, tenantId]);
    return null;
}
