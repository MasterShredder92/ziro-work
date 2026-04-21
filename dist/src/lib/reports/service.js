/**
 * Reporting OS — service layer.
 *
 * Wraps the pure report definitions with tenant enforcement and
 * audit logging. All server/API entry points should call into
 * this module rather than invoking definitions directly.
 */
import "server-only";
import { assertTenantAccess } from "@/lib/auth/guards";
import { logAudit } from "@/lib/audit/log";
import { getSession } from "@/lib/auth/session";
import { getReportDefinitionById, listReportDefinitions, } from "./definitions";
function normalizeRange(params) {
    var _a, _b, _c, _d, _e, _f;
    const today = new Date();
    const defaultTo = today.toISOString().slice(0, 10);
    const defaultFromDate = new Date(today.getTime());
    defaultFromDate.setUTCMonth(defaultFromDate.getUTCMonth() - 3);
    const defaultFrom = defaultFromDate.toISOString().slice(0, 10);
    const fromParam = (_c = (_b = (_a = params === null || params === void 0 ? void 0 : params.range) === null || _a === void 0 ? void 0 : _a.from) !== null && _b !== void 0 ? _b : params === null || params === void 0 ? void 0 : params.from) !== null && _c !== void 0 ? _c : defaultFrom;
    const toParam = (_f = (_e = (_d = params === null || params === void 0 ? void 0 : params.range) === null || _d === void 0 ? void 0 : _d.to) !== null && _e !== void 0 ? _e : params === null || params === void 0 ? void 0 : params.to) !== null && _f !== void 0 ? _f : defaultTo;
    return {
        from: typeof fromParam === "string" && fromParam.length > 0
            ? fromParam
            : defaultFrom,
        to: typeof toParam === "string" && toParam.length > 0 ? toParam : defaultTo,
    };
}
export async function listReports() {
    return listReportDefinitions().map((d) => ({
        id: d.id,
        name: d.name,
        description: d.description,
        parameters: d.parameters,
    }));
}
export async function getReportDefinition(reportId) {
    const def = getReportDefinitionById(reportId);
    if (!def)
        return null;
    return {
        id: def.id,
        name: def.name,
        description: def.description,
        parameters: def.parameters,
    };
}
/**
 * Runs a report under a tenant context.
 *
 * Enforces:
 *   - tenantId is present
 *   - current session has tenant access (via assertTenantAccess)
 *   - audit log start + finish entries
 */
export async function runReport(reportId, params, context) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m;
    const startedAtDate = new Date();
    const startedAt = startedAtDate.toISOString();
    const t0 = Date.now();
    const tenantId = ((_a = context.tenantId) !== null && _a !== void 0 ? _a : "").trim();
    if (!tenantId) {
        const error = { message: "TENANT_REQUIRED", code: "TENANT_REQUIRED" };
        return {
            ok: false,
            error,
            execution: {
                reportId,
                tenantId,
                profileId: (_b = context.profileId) !== null && _b !== void 0 ? _b : null,
                startedAt,
                endedAt: new Date().toISOString(),
                durationMs: Date.now() - t0,
                ok: false,
                error,
            },
        };
    }
    let session = null;
    try {
        session = await getSession();
    }
    catch (_o) {
        session = null;
    }
    try {
        await assertTenantAccess(tenantId);
    }
    catch (err) {
        const message = err instanceof Error ? err.message : "FORBIDDEN";
        const error = { message, code: "FORBIDDEN" };
        await logAudit("reports.run.denied", {
            reportId,
            tenantId,
            profileId: (_d = (_c = context.profileId) !== null && _c !== void 0 ? _c : session === null || session === void 0 ? void 0 : session.userId) !== null && _d !== void 0 ? _d : null,
            error: message,
        });
        return {
            ok: false,
            error,
            execution: {
                reportId,
                tenantId,
                profileId: (_f = (_e = context.profileId) !== null && _e !== void 0 ? _e : session === null || session === void 0 ? void 0 : session.userId) !== null && _f !== void 0 ? _f : null,
                startedAt,
                endedAt: new Date().toISOString(),
                durationMs: Date.now() - t0,
                ok: false,
                error,
            },
        };
    }
    const definition = getReportDefinitionById(reportId);
    if (!definition) {
        const error = {
            message: `Report '${reportId}' not found`,
            code: "NOT_FOUND",
        };
        return {
            ok: false,
            error,
            execution: {
                reportId,
                tenantId,
                profileId: (_h = (_g = context.profileId) !== null && _g !== void 0 ? _g : session === null || session === void 0 ? void 0 : session.userId) !== null && _h !== void 0 ? _h : null,
                startedAt,
                endedAt: new Date().toISOString(),
                durationMs: Date.now() - t0,
                ok: false,
                error,
            },
        };
    }
    const range = normalizeRange(params);
    const runContext = {
        tenantId,
        profileId: (_k = (_j = context.profileId) !== null && _j !== void 0 ? _j : session === null || session === void 0 ? void 0 : session.userId) !== null && _k !== void 0 ? _k : null,
        role: (_m = (_l = context.role) !== null && _l !== void 0 ? _l : session === null || session === void 0 ? void 0 : session.role) !== null && _m !== void 0 ? _m : null,
        range,
        params: (params !== null && params !== void 0 ? params : {}),
    };
    await logAudit("reports.run.start", {
        reportId,
        tenantId,
        profileId: runContext.profileId,
        range,
    });
    try {
        const result = await definition.run(runContext);
        const endedAt = new Date().toISOString();
        const durationMs = Date.now() - t0;
        await logAudit("reports.run.finish", {
            reportId,
            tenantId,
            profileId: runContext.profileId,
            durationMs,
            rowCount: result.rows.length,
            ok: true,
        });
        return {
            ok: true,
            result,
            execution: {
                reportId,
                tenantId,
                profileId: runContext.profileId,
                startedAt,
                endedAt,
                durationMs,
                ok: true,
            },
        };
    }
    catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        const code = err && typeof err === "object" && "code" in err
            ? String(err.code)
            : undefined;
        const error = { message, code };
        const endedAt = new Date().toISOString();
        const durationMs = Date.now() - t0;
        await logAudit("reports.run.finish", {
            reportId,
            tenantId,
            profileId: runContext.profileId,
            durationMs,
            ok: false,
            error: message,
        });
        return {
            ok: false,
            error,
            execution: {
                reportId,
                tenantId,
                profileId: runContext.profileId,
                startedAt,
                endedAt,
                durationMs,
                ok: false,
                error,
            },
        };
    }
}
