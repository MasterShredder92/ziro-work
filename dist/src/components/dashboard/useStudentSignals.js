"use client";
import { useMemo, useEffect, useState } from "react";
import { useEvents, useStudents } from "@/hooks/data";
import { DASHBOARD_TENANT_ID } from "./constants";
function isLeadEvent(eventType) {
    return /lead|intake|trial_scheduled/i.test(eventType);
}
export function useStudentSignals() {
    var _a;
    const tenantId = DASHBOARD_TENANT_ID;
    const [nowMs, setNowMs] = useState(null);
    useEffect(() => {
        queueMicrotask(() => setNowMs(Date.now()));
    }, []);
    const studentParams = useMemo(() => ({
        tenantId,
        page: { mode: "offset", page: 1, pageSize: 250 },
    }), [tenantId]);
    const eventParams = useMemo(() => ({
        tenantId,
        page: { mode: "offset", page: 1, pageSize: 120 },
    }), [tenantId]);
    const { data: stuData, error: stuErr, isLoading: stuLoading } = useStudents(studentParams);
    const { data: evData, error: evErr, isLoading: evLoading } = useEvents(eventParams);
    const signals = useMemo(() => {
        var _a, _b;
        const students = (_a = stuData === null || stuData === void 0 ? void 0 : stuData.items) !== null && _a !== void 0 ? _a : [];
        const events = (_b = evData === null || evData === void 0 ? void 0 : evData.items) !== null && _b !== void 0 ? _b : [];
        const now = nowMs !== null && nowMs !== void 0 ? nowMs : 0;
        const weekMs = 7 * 24 * 60 * 60 * 1000;
        const pendingEnrollments = students.filter((s) => s.status === "active" && s.onboarding_stage === "new").length;
        const atRiskStudents = students.filter((s) => s.onboarding_stage === "at_risk" ||
            (s.churn_risk && String(s.churn_risk).toLowerCase() === "high")).length;
        const newLeadsWeek = nowMs == null
            ? 0
            : events.filter((e) => {
                const t = new Date(e.created_at).getTime();
                if (!Number.isFinite(t) || now - t > weekMs)
                    return false;
                return isLeadEvent(e.event_type);
            }).length;
        return { atRiskStudents, pendingEnrollments, newLeadsWeek };
    }, [stuData, evData, nowMs]);
    const error = (_a = stuErr !== null && stuErr !== void 0 ? stuErr : evErr) !== null && _a !== void 0 ? _a : null;
    return {
        signals,
        loading: stuLoading || evLoading,
        error: error instanceof Error ? error : error ? new Error(String(error)) : null,
    };
}
