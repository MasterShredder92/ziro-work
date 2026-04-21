import { NextResponse } from "next/server";
import { badRequest, readJson, serverError } from "@/lib/http";
import { logAudit } from "@/lib/audit/log";
import { getSession } from "@/lib/auth/session";
import { submitForm, submitPublicFormBySlug } from "@/lib/forms/service";
import { getForm, getPublicFormBySlug } from "@/lib/forms/queries";
import { DEFAULT_TENANT_ID } from "@/lib/defaultTenantId";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
function normalizeAnswers(raw) {
    if (!raw)
        return [];
    if (Array.isArray(raw)) {
        return raw
            .filter((a) => Boolean(a && typeof a === "object" && "fieldKey" in a))
            .map((a) => {
            var _a, _b, _c, _d;
            return ({
                fieldId: (_a = a.fieldId) !== null && _a !== void 0 ? _a : "",
                fieldKey: (_b = a.fieldKey) !== null && _b !== void 0 ? _b : "",
                label: (_d = (_c = a.label) !== null && _c !== void 0 ? _c : a.fieldKey) !== null && _d !== void 0 ? _d : "",
                value: a.value,
                answeredAt: a.answeredAt,
            });
        });
    }
    return Object.entries(raw).map(([key, value]) => ({
        fieldId: "",
        fieldKey: key,
        label: key,
        value,
    }));
}
export async function POST(req) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l;
    try {
        const body = await readJson(req);
        if (!body)
            return badRequest("Invalid JSON body.");
        const hasFormId = typeof body.formId === "string" && body.formId.trim();
        const hasSlug = typeof body.slug === "string" && body.slug.trim();
        if (!hasFormId && !hasSlug) {
            return badRequest("'formId' or 'slug' is required.");
        }
        if (!body.answers) {
            return badRequest("'answers' is required.");
        }
        const session = await getSession();
        const tenantId = (session === null || session === void 0 ? void 0 : session.tenantId) ||
            (typeof body.tenantId === "string" && body.tenantId.trim()) ||
            DEFAULT_TENANT_ID;
        const profileId = (_b = (_a = body.profileId) !== null && _a !== void 0 ? _a : session === null || session === void 0 ? void 0 : session.userId) !== null && _b !== void 0 ? _b : null;
        const answers = normalizeAnswers(body.answers);
        if (hasSlug) {
            const slug = body.slug.trim();
            const form = await getPublicFormBySlug(slug, tenantId);
            if (!form)
                return badRequest("Form not found.");
            if (form.status === "archived") {
                return badRequest("This form is no longer accepting responses.");
            }
            const result = await submitPublicFormBySlug(slug, tenantId, answers, {
                profileId,
                submittedBy: profileId,
                startedAt: (_c = body.startedAt) !== null && _c !== void 0 ? _c : null,
                metadata: (_d = body.clientMetadata) !== null && _d !== void 0 ? _d : undefined,
            });
            await logAudit("forms.api.run.completed", {
                tenantId,
                profileId,
                formId: form.id,
                submissionId: result.submission.id,
                ok: result.validation.valid,
                issueCount: result.validation.issues.length,
            });
            return NextResponse.json({
                ok: result.validation.valid,
                submission: result.submission,
                validation: result.validation,
                redirectUrl: (_e = form.successRedirectUrl) !== null && _e !== void 0 ? _e : null,
                message: (_f = form.successMessage) !== null && _f !== void 0 ? _f : null,
                automationsDispatched: result.automationsDispatched,
            }, { status: result.validation.valid ? 200 : 422 });
        }
        const formId = body.formId.trim();
        const form = await getForm(formId, tenantId);
        if (!form)
            return badRequest("Form not found.");
        if (form.status === "archived") {
            return badRequest("This form is no longer accepting responses.");
        }
        await logAudit("forms.api.run.received", {
            tenantId,
            profileId,
            formId: form.id,
            source: (_g = body.source) !== null && _g !== void 0 ? _g : null,
        });
        const result = await submitForm(form.id, answers, {
            tenantId,
            profileId,
            submittedBy: profileId,
            startedAt: (_h = body.startedAt) !== null && _h !== void 0 ? _h : null,
            metadata: (_j = body.clientMetadata) !== null && _j !== void 0 ? _j : undefined,
        });
        await logAudit("forms.api.run.completed", {
            tenantId,
            profileId,
            formId: form.id,
            submissionId: result.submission.id,
            ok: result.validation.valid,
            issueCount: result.validation.issues.length,
        });
        return NextResponse.json({
            ok: result.validation.valid,
            submission: result.submission,
            validation: result.validation,
            redirectUrl: (_k = form.successRedirectUrl) !== null && _k !== void 0 ? _k : null,
            message: (_l = form.successMessage) !== null && _l !== void 0 ? _l : null,
            automationsDispatched: result.automationsDispatched,
        }, { status: result.validation.valid ? 200 : 422 });
    }
    catch (err) {
        return serverError(err);
    }
}
