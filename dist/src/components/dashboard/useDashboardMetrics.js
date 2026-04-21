"use client";
import { useMemo } from "react";
import { useEvents, useInvoices } from "@/hooks/data";
import { DASHBOARD_TENANT_ID } from "./constants";
import { computeDashboardMetrics } from "./computeDashboardMetrics";
export function useDashboardMetrics() {
    var _a;
    const tenantId = DASHBOARD_TENANT_ID;
    const invoiceParams = useMemo(() => ({
        tenantId,
        page: { mode: "offset", page: 1, pageSize: 200 },
    }), [tenantId]);
    const eventParams = useMemo(() => ({
        tenantId,
        page: { mode: "offset", page: 1, pageSize: 180 },
    }), [tenantId]);
    const { data: invData, error: invErr, isLoading: invLoading } = useInvoices(invoiceParams);
    const { data: evData, error: evErr, isLoading: evLoading } = useEvents(eventParams);
    const metrics = useMemo(() => {
        var _a, _b;
        const invoices = (_a = invData === null || invData === void 0 ? void 0 : invData.items) !== null && _a !== void 0 ? _a : [];
        const events = (_b = evData === null || evData === void 0 ? void 0 : evData.items) !== null && _b !== void 0 ? _b : [];
        return computeDashboardMetrics(invoices, events);
    }, [invData, evData]);
    const error = (_a = invErr !== null && invErr !== void 0 ? invErr : evErr) !== null && _a !== void 0 ? _a : null;
    return {
        metrics,
        loading: invLoading || evLoading,
        error: error instanceof Error ? error : error ? new Error(String(error)) : null,
    };
}
