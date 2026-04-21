import { clientFor } from "./_client";
export async function listRelationshipsForFamily(tenantId, familyId) {
    var _a, _b;
    const supabase = clientFor(tenantId);
    const { data: familyRow, error: familyErr } = await supabase
        .from("families")
        .select("*")
        .eq("tenant_id", tenantId)
        .eq("id", familyId)
        .maybeSingle();
    if (familyErr)
        throw familyErr;
    const { data: students, error: studentErr } = await supabase
        .from("students")
        .select("*")
        .eq("tenant_id", tenantId)
        .eq("family_id", familyId);
    if (studentErr)
        throw studentErr;
    const rels = [];
    if (familyRow) {
        const f = familyRow;
        if (f.primary_contact_name || f.primary_email || f.primary_phone) {
            rels.push({
                id: `family:${familyId}:primary`,
                tenantId,
                familyId,
                contactId: `family:${familyId}`,
                contactKind: "family",
                role: "primary_guardian",
                isPrimary: true,
                createdAt: (_a = f.created_at) !== null && _a !== void 0 ? _a : null,
            });
        }
    }
    for (const s of (students !== null && students !== void 0 ? students : [])) {
        rels.push({
            id: `student:${s.id}:member`,
            tenantId,
            familyId,
            contactId: `student:${s.id}`,
            contactKind: "student",
            role: "student",
            isPrimary: false,
            createdAt: (_b = s.created_at) !== null && _b !== void 0 ? _b : null,
        });
    }
    return rels;
}
export async function addStudentToFamily(tenantId, studentId, familyId) {
    const supabase = clientFor(tenantId);
    const { error } = await supabase
        .from("students")
        .update({ family_id: familyId, updated_at: new Date().toISOString() })
        .eq("tenant_id", tenantId)
        .eq("id", studentId);
    if (error)
        throw error;
}
export async function removeStudentFromFamily(tenantId, studentId) {
    const supabase = clientFor(tenantId);
    const { error } = await supabase
        .from("students")
        .update({ family_id: null, updated_at: new Date().toISOString() })
        .eq("tenant_id", tenantId)
        .eq("id", studentId);
    if (error)
        throw error;
}
export async function setPrimaryGuardian(tenantId, familyId, input) {
    const supabase = clientFor(tenantId);
    const patch = {
        updated_at: new Date().toISOString(),
    };
    if (input.firstName !== undefined)
        patch.parent_first_name = input.firstName;
    if (input.lastName !== undefined)
        patch.parent_last_name = input.lastName;
    if (input.email !== undefined)
        patch.primary_email = input.email;
    if (input.phone !== undefined)
        patch.primary_phone = input.phone;
    const contactName = [input.firstName, input.lastName]
        .filter((s) => Boolean(s && s.length > 0))
        .join(" ")
        .trim();
    if (contactName)
        patch.primary_contact_name = contactName;
    if (input.relationship)
        patch.emergency_contact_relationship = input.relationship;
    const { error } = await supabase
        .from("families")
        .update(patch)
        .eq("tenant_id", tenantId)
        .eq("id", familyId);
    if (error)
        throw error;
}
export async function listFamiliesForStudent(tenantId, studentId) {
    const supabase = clientFor(tenantId);
    const { data, error } = await supabase
        .from("students")
        .select("family_id")
        .eq("tenant_id", tenantId)
        .eq("id", studentId)
        .maybeSingle();
    if (error)
        throw error;
    const familyId = data === null || data === void 0 ? void 0 : data.family_id;
    return familyId ? [familyId] : [];
}
