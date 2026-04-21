import { NextResponse } from "next/server";
import { noContent, notFound, ok, readJson, resolveTenantId, serverError, } from "@/lib/http";
import { requirePermission, assertTenantAccess } from "@/lib/auth/guards";
import { logAudit } from "@/lib/audit/log";
import { deleteForm, deleteFormField, getFormWithFields, listFormFields, updateForm, upsertFormField, } from "@/lib/forms/queries";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
function forbidden(message = "FORBIDDEN") {
    return NextResponse.json({ error: message }, { status: 403 });
}
export async function GET(req, { params }) {
    const { id } = await params;
    try {
        let session;
        try {
            session = await requirePermission("forms.read")();
        }
        catch (_a) {
            return forbidden();
        }
        const tenantId = session.tenantId || resolveTenantId(req);
        try {
            await assertTenantAccess(tenantId);
        }
        catch (_b) {
            return forbidden("TENANT_MISMATCH");
        }
        const bundle = await getFormWithFields(id, tenantId);
        if (!bundle)
            return notFound("Form not found");
        await logAudit("forms.api.get", {
            tenantId,
            profileId: session.userId,
            formId: id,
        });
        return ok({ data: bundle });
    }
    catch (err) {
        return serverError(err);
    }
}
export async function PATCH(req, { params }) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m;
    const { id } = await params;
    try {
        let session;
        try {
            session = await requirePermission("forms.write")();
        }
        catch (_o) {
            return forbidden();
        }
        const tenantId = session.tenantId || resolveTenantId(req);
        try {
            await assertTenantAccess(tenantId);
        }
        catch (_p) {
            return forbidden("TENANT_MISMATCH");
        }
        const body = await readJson(req);
        if (!body)
            return ok({ data: null });
        const existing = await getFormWithFields(id, tenantId);
        if (!existing)
            return notFound("Form not found");
        const formInput = body.form ? body.form : body;
        const updated = await updateForm(id, tenantId, {
            name: (_a = formInput.name) !== null && _a !== void 0 ? _a : existing.form.name,
            slug: formInput.slug,
            description: formInput.description,
            status: (_b = formInput.status) !== null && _b !== void 0 ? _b : existing.form.status,
            isPublic: formInput.isPublic,
            submitLabel: formInput.submitLabel,
            successMessage: formInput.successMessage,
            successRedirectUrl: formInput.successRedirectUrl,
            settings: formInput.settings,
            updatedBy: (_c = session.userId) !== null && _c !== void 0 ? _c : null,
        });
        if (Array.isArray(body.fields)) {
            const existingIds = new Set(existing.fields.map((f) => f.id));
            const keepIds = new Set();
            for (let i = 0; i < body.fields.length; i += 1) {
                const f = body.fields[i];
                const isExisting = f.id && existingIds.has(f.id);
                const saved = await upsertFormField(id, tenantId, {
                    id: isExisting ? f.id : undefined,
                    fieldKey: f.fieldKey,
                    label: f.label,
                    fieldType: f.fieldType,
                    placeholder: (_d = f.placeholder) !== null && _d !== void 0 ? _d : null,
                    helpText: (_e = f.helpText) !== null && _e !== void 0 ? _e : null,
                    required: f.required === true,
                    position: typeof f.position === "number" ? f.position : i,
                    options: (_f = f.options) !== null && _f !== void 0 ? _f : [],
                    validationRules: (_g = f.validationRules) !== null && _g !== void 0 ? _g : [],
                    defaultValue: (_h = f.defaultValue) !== null && _h !== void 0 ? _h : null,
                    metadata: (_j = f.metadata) !== null && _j !== void 0 ? _j : {},
                    sectionId: (_k = f.sectionId) !== null && _k !== void 0 ? _k : null,
                    sectionTitle: (_l = f.sectionTitle) !== null && _l !== void 0 ? _l : null,
                });
                keepIds.add(saved.id);
            }
            for (const f of existing.fields) {
                if (!keepIds.has(f.id)) {
                    await deleteFormField(f.id, tenantId);
                }
            }
        }
        const refreshed = await getFormWithFields(id, tenantId);
        const fields = (_m = refreshed === null || refreshed === void 0 ? void 0 : refreshed.fields) !== null && _m !== void 0 ? _m : (await listFormFields(id, tenantId));
        await logAudit("forms.api.update", {
            tenantId,
            profileId: session.userId,
            formId: id,
            fieldCount: fields.length,
        });
        return ok({ data: { form: updated, fields } });
    }
    catch (err) {
        return serverError(err);
    }
}
export async function DELETE(req, { params }) {
    const { id } = await params;
    try {
        let session;
        try {
            session = await requirePermission("forms.write")();
        }
        catch (_a) {
            return forbidden();
        }
        const tenantId = session.tenantId || resolveTenantId(req);
        try {
            await assertTenantAccess(tenantId);
        }
        catch (_b) {
            return forbidden("TENANT_MISMATCH");
        }
        const existing = await getFormWithFields(id, tenantId);
        if (!existing)
            return notFound("Form not found");
        for (const f of existing.fields) {
            await deleteFormField(f.id, tenantId);
        }
        await deleteForm(id, tenantId);
        await logAudit("forms.api.delete", {
            tenantId,
            profileId: session.userId,
            formId: id,
        });
        return noContent();
    }
    catch (err) {
        return serverError(err);
    }
}
