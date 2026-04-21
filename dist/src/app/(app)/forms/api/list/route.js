import { NextResponse } from "next/server";
import { badRequest, created, ok, readJson, resolveTenantId, serverError, } from "@/lib/http";
import { requirePermission, assertTenantAccess } from "@/lib/auth/guards";
import { logAudit } from "@/lib/audit/log";
import { createForm, listForms, upsertFormField, } from "@/lib/forms/queries";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
function forbidden(message = "FORBIDDEN") {
    return NextResponse.json({ error: message }, { status: 403 });
}
export async function GET(req) {
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
        const forms = await listForms(tenantId);
        await logAudit("forms.api.list", {
            tenantId,
            profileId: session.userId,
            count: forms.length,
        });
        return ok({ data: forms });
    }
    catch (err) {
        return serverError(err);
    }
}
export async function POST(req) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v;
    try {
        let session;
        try {
            session = await requirePermission("forms.write")();
        }
        catch (_w) {
            return forbidden();
        }
        const tenantId = session.tenantId || resolveTenantId(req);
        try {
            await assertTenantAccess(tenantId);
        }
        catch (_x) {
            return forbidden("TENANT_MISMATCH");
        }
        const body = await readJson(req);
        const formInput = Object.assign(Object.assign({}, ((_a = body === null || body === void 0 ? void 0 : body.form) !== null && _a !== void 0 ? _a : {})), (body && !body.form
            ? {
                name: body.name,
                slug: body.slug,
                description: body.description,
                status: body.status,
                isPublic: body.isPublic,
                submitLabel: body.submitLabel,
                successMessage: body.successMessage,
                successRedirectUrl: body.successRedirectUrl,
                settings: body.settings,
            }
            : {}));
        if (!formInput ||
            typeof formInput.name !== "string" ||
            !formInput.name.trim()) {
            return badRequest("Form 'name' is required.");
        }
        const form = await createForm(tenantId, {
            name: formInput.name,
            slug: (_b = formInput.slug) !== null && _b !== void 0 ? _b : null,
            description: (_c = formInput.description) !== null && _c !== void 0 ? _c : null,
            status: (_d = formInput.status) !== null && _d !== void 0 ? _d : "draft",
            isPublic: formInput.isPublic === true,
            submitLabel: (_e = formInput.submitLabel) !== null && _e !== void 0 ? _e : null,
            successMessage: (_f = formInput.successMessage) !== null && _f !== void 0 ? _f : null,
            successRedirectUrl: (_g = formInput.successRedirectUrl) !== null && _g !== void 0 ? _g : null,
            settings: (_h = formInput.settings) !== null && _h !== void 0 ? _h : {},
            createdBy: (_j = session.userId) !== null && _j !== void 0 ? _j : null,
            updatedBy: (_k = session.userId) !== null && _k !== void 0 ? _k : null,
        });
        if (body && Array.isArray(body.fields)) {
            for (let i = 0; i < body.fields.length; i += 1) {
                const f = body.fields[i];
                await upsertFormField(form.id, tenantId, {
                    fieldKey: f.fieldKey,
                    label: f.label,
                    fieldType: f.fieldType,
                    placeholder: (_l = f.placeholder) !== null && _l !== void 0 ? _l : null,
                    helpText: (_m = f.helpText) !== null && _m !== void 0 ? _m : null,
                    required: f.required === true,
                    position: typeof f.position === "number" ? f.position : i,
                    options: (_o = f.options) !== null && _o !== void 0 ? _o : [],
                    validationRules: (_p = f.validationRules) !== null && _p !== void 0 ? _p : [],
                    defaultValue: (_q = f.defaultValue) !== null && _q !== void 0 ? _q : null,
                    metadata: (_r = f.metadata) !== null && _r !== void 0 ? _r : {},
                    sectionId: (_s = f.sectionId) !== null && _s !== void 0 ? _s : null,
                    sectionTitle: (_t = f.sectionTitle) !== null && _t !== void 0 ? _t : null,
                });
            }
        }
        await logAudit("forms.api.create", {
            tenantId,
            profileId: session.userId,
            formId: form.id,
            fieldCount: (_v = (_u = body === null || body === void 0 ? void 0 : body.fields) === null || _u === void 0 ? void 0 : _u.length) !== null && _v !== void 0 ? _v : 0,
        });
        return created({ data: form });
    }
    catch (err) {
        return serverError(err);
    }
}
