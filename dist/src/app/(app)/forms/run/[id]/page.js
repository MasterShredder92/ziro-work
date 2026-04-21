import { jsx as _jsx } from "react/jsx-runtime";
import { notFound } from "next/navigation";
import { getForm, getPublicFormBySlug, listFormFields, } from "@/lib/forms/queries";
import { DEFAULT_TENANT_ID } from "@/lib/defaultTenantId";
import { FormRunner } from "../../components";
export const dynamic = "force-dynamic";
export default async function FormRunnerPage({ params, searchParams, }) {
    var _a, _b;
    const { id } = await params;
    const sp = await searchParams;
    const tenantId = ((_a = sp === null || sp === void 0 ? void 0 : sp.tenantId) === null || _a === void 0 ? void 0 : _a.trim()) || DEFAULT_TENANT_ID;
    const form = (_b = (await getPublicFormBySlug(id, tenantId))) !== null && _b !== void 0 ? _b : (await getForm(id, tenantId));
    if (!form || !form.isPublic)
        notFound();
    const fields = await listFormFields(form.id, form.tenantId);
    return _jsx(FormRunner, { form: form, fields: fields });
}
