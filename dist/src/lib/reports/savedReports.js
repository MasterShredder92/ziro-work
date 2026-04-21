/**
 * Reporting OS — saved reports + widget service.
 *
 * Bridges the @data/reports and @data/reportWidgets facades with the
 * reports service. Handles tenant enforcement, audit logging, mapping
 * between row shapes and domain types, and coordinated widget upserts.
 */
import "server-only";
import { createReport as createReportRow, deleteReport as deleteReportRow, getReport as getReportRow, listReports as listReportRows, updateReport as updateReportRow, } from "@data/reports";
import { deleteWidget as deleteWidgetRow, deleteWidgetsByReport, listWidgetsByReport, upsertWidget as upsertWidgetRow, } from "@data/reportWidgets";
import { assertTenantAccess } from "@/lib/auth/guards";
import { logAudit } from "@/lib/audit/log";
// ---------------------------------------------------------------------------
// Mapping
// ---------------------------------------------------------------------------
function mapReport(row) {
    var _a, _b, _c, _d, _e;
    return {
        id: row.id,
        tenantId: row.tenant_id,
        name: row.name,
        slug: row.slug,
        description: row.description,
        kind: (_a = row.kind) !== null && _a !== void 0 ? _a : "custom",
        status: row.status,
        source: row.source,
        query: ((_b = row.query) !== null && _b !== void 0 ? _b : null),
        layout: row.layout,
        parameters: ((_c = row.parameters) !== null && _c !== void 0 ? _c : []),
        tags: (_d = row.tags) !== null && _d !== void 0 ? _d : [],
        isPinned: (_e = row.is_pinned) !== null && _e !== void 0 ? _e : false,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        createdBy: row.created_by,
        updatedBy: row.updated_by,
    };
}
function mapWidget(row) {
    var _a, _b;
    return {
        id: row.id,
        reportId: row.report_id,
        tenantId: row.tenant_id,
        widgetType: row.widget_type,
        title: row.title,
        position: row.position,
        size: (_a = row.size) !== null && _a !== void 0 ? _a : "md",
        kpiKey: row.kpi_key,
        query: ((_b = row.query) !== null && _b !== void 0 ? _b : null),
        config: row.config,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    };
}
// ---------------------------------------------------------------------------
// Read
// ---------------------------------------------------------------------------
export async function listSavedReports(tenantId, opts) {
    var _a;
    await assertTenantAccess(tenantId);
    const rows = await listReportRows(tenantId, { includeArchived: opts === null || opts === void 0 ? void 0 : opts.includeArchived }, { limit: (_a = opts === null || opts === void 0 ? void 0 : opts.limit) !== null && _a !== void 0 ? _a : 100 });
    return rows.map(mapReport);
}
export async function getSavedReport(reportId, tenantId) {
    await assertTenantAccess(tenantId);
    const row = await getReportRow(reportId, tenantId);
    if (!row)
        return null;
    const widgets = await listWidgetsByReport(reportId, tenantId);
    return {
        report: mapReport(row),
        widgets: widgets.map(mapWidget),
    };
}
// ---------------------------------------------------------------------------
// Write
// ---------------------------------------------------------------------------
export async function createSavedReport(tenantId, input, actorProfileId) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r;
    await assertTenantAccess(tenantId);
    const row = await createReportRow(tenantId, {
        name: input.name,
        slug: (_a = input.slug) !== null && _a !== void 0 ? _a : null,
        description: (_b = input.description) !== null && _b !== void 0 ? _b : null,
        kind: (_c = input.kind) !== null && _c !== void 0 ? _c : "custom",
        status: (_d = input.status) !== null && _d !== void 0 ? _d : "draft",
        source: (_e = input.source) !== null && _e !== void 0 ? _e : "custom",
        query: ((_f = input.query) !== null && _f !== void 0 ? _f : null),
        layout: (_g = input.layout) !== null && _g !== void 0 ? _g : null,
        parameters: ((_h = input.parameters) !== null && _h !== void 0 ? _h : []),
        tags: (_j = input.tags) !== null && _j !== void 0 ? _j : [],
        is_pinned: (_k = input.isPinned) !== null && _k !== void 0 ? _k : false,
        created_by: actorProfileId !== null && actorProfileId !== void 0 ? actorProfileId : null,
        updated_by: actorProfileId !== null && actorProfileId !== void 0 ? actorProfileId : null,
    });
    const widgets = [];
    if (input.widgets) {
        for (const [i, w] of input.widgets.entries()) {
            widgets.push(await upsertWidgetRow(tenantId, {
                report_id: row.id,
                widget_type: w.widgetType,
                title: (_l = w.title) !== null && _l !== void 0 ? _l : null,
                position: (_m = w.position) !== null && _m !== void 0 ? _m : i,
                size: (_o = w.size) !== null && _o !== void 0 ? _o : "md",
                config: (_p = w.config) !== null && _p !== void 0 ? _p : null,
                query: ((_q = w.query) !== null && _q !== void 0 ? _q : null),
                kpi_key: (_r = w.kpiKey) !== null && _r !== void 0 ? _r : null,
            }));
        }
    }
    await logAudit("reports.create", {
        tenantId,
        profileId: actorProfileId !== null && actorProfileId !== void 0 ? actorProfileId : null,
        reportId: row.id,
        name: row.name,
    });
    return {
        report: mapReport(row),
        widgets: widgets.map(mapWidget),
    };
}
export async function updateSavedReport(reportId, tenantId, input, actorProfileId) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s;
    await assertTenantAccess(tenantId);
    const existing = await getReportRow(reportId, tenantId);
    if (!existing)
        return null;
    const updated = await updateReportRow(reportId, tenantId, {
        name: (_a = input.name) !== null && _a !== void 0 ? _a : existing.name,
        slug: (_b = input.slug) !== null && _b !== void 0 ? _b : existing.slug,
        description: (_c = input.description) !== null && _c !== void 0 ? _c : existing.description,
        kind: (_d = input.kind) !== null && _d !== void 0 ? _d : existing.kind,
        status: (_e = input.status) !== null && _e !== void 0 ? _e : existing.status,
        source: (_f = input.source) !== null && _f !== void 0 ? _f : existing.source,
        query: ((_g = input.query) !== null && _g !== void 0 ? _g : existing.query),
        layout: (_h = input.layout) !== null && _h !== void 0 ? _h : existing.layout,
        parameters: ((_j = input.parameters) !== null && _j !== void 0 ? _j : existing.parameters),
        tags: (_k = input.tags) !== null && _k !== void 0 ? _k : existing.tags,
        is_pinned: (_l = input.isPinned) !== null && _l !== void 0 ? _l : existing.is_pinned,
        updated_by: actorProfileId !== null && actorProfileId !== void 0 ? actorProfileId : null,
    });
    if (!updated)
        return null;
    if (input.widgets) {
        await deleteWidgetsByReport(reportId, tenantId);
        for (const [i, w] of input.widgets.entries()) {
            await upsertWidgetRow(tenantId, {
                report_id: reportId,
                widget_type: w.widgetType,
                title: (_m = w.title) !== null && _m !== void 0 ? _m : null,
                position: (_o = w.position) !== null && _o !== void 0 ? _o : i,
                size: (_p = w.size) !== null && _p !== void 0 ? _p : "md",
                config: (_q = w.config) !== null && _q !== void 0 ? _q : null,
                query: ((_r = w.query) !== null && _r !== void 0 ? _r : null),
                kpi_key: (_s = w.kpiKey) !== null && _s !== void 0 ? _s : null,
            });
        }
    }
    const widgets = await listWidgetsByReport(reportId, tenantId);
    await logAudit("reports.update", {
        tenantId,
        profileId: actorProfileId !== null && actorProfileId !== void 0 ? actorProfileId : null,
        reportId,
    });
    return {
        report: mapReport(updated),
        widgets: widgets.map(mapWidget),
    };
}
export async function deleteSavedReport(reportId, tenantId, actorProfileId) {
    await assertTenantAccess(tenantId);
    await deleteWidgetsByReport(reportId, tenantId);
    const ok = await deleteReportRow(reportId, tenantId);
    await logAudit("reports.delete", {
        tenantId,
        profileId: actorProfileId !== null && actorProfileId !== void 0 ? actorProfileId : null,
        reportId,
        ok,
    });
    return ok;
}
export async function upsertWidget(tenantId, reportId, input) {
    var _a, _b, _c, _d, _e, _f;
    await assertTenantAccess(tenantId);
    const row = await upsertWidgetRow(tenantId, {
        id: input.id,
        report_id: reportId,
        widget_type: input.widgetType,
        title: (_a = input.title) !== null && _a !== void 0 ? _a : null,
        position: (_b = input.position) !== null && _b !== void 0 ? _b : 0,
        size: (_c = input.size) !== null && _c !== void 0 ? _c : "md",
        config: (_d = input.config) !== null && _d !== void 0 ? _d : null,
        query: ((_e = input.query) !== null && _e !== void 0 ? _e : null),
        kpi_key: (_f = input.kpiKey) !== null && _f !== void 0 ? _f : null,
    });
    return mapWidget(row);
}
export async function deleteWidget(widgetId, tenantId) {
    await assertTenantAccess(tenantId);
    return deleteWidgetRow(widgetId, tenantId);
}
