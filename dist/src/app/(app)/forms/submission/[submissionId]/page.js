import { jsx as _jsx } from "react/jsx-runtime";
import "server-only";
import { notFound } from "next/navigation";
import { getForm, listFormFields } from "@/lib/forms/queries";
import { getSubmissionForTenant } from "@/lib/forms/service";
import { resolveFormsContext } from "../../guard";
import { SubmissionDetail } from "../../components";
export const dynamic = "force-dynamic";
export default async function SubmissionPage({ params }) {
    await resolveFormsContext();
    const { submissionId } = await params;
    const submission = await getSubmissionForTenant(submissionId);
    if (!submission)
        notFound();
    const form = await getForm(submission.formId, submission.tenantId);
    if (!form)
        notFound();
    const fields = await listFormFields(submission.formId, submission.tenantId);
    return _jsx(SubmissionDetail, { submission: submission, form: form, fields: fields });
}
