"use server";
import { updateContact } from "@data/contacts";
import { updateEnrollment } from "@data/enrollments";
import { updateFamily } from "@data/families";
import { updateStudent } from "@data/students";
import { updateTeacher } from "@data/teachers";
import { getCRMTenantId } from "../../_tenant";
export async function updateCrmRow(resource, id, patch) {
    const tenantId = await getCRMTenantId();
    switch (resource) {
        case "contacts":
            return updateContact(tenantId, id, patch);
        case "students":
            return updateStudent(id, tenantId, patch);
        case "families":
            return updateFamily(id, tenantId, patch);
        case "teachers":
            return updateTeacher(id, tenantId, patch);
        case "enrollments":
            return updateEnrollment(id, tenantId, patch);
        default: {
            const neverResource = resource;
            throw new Error(`Unsupported CRM resource: ${String(neverResource)}`);
        }
    }
}
