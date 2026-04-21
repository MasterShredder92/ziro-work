import { clientFor } from "./_client";
function composeName(first, last, fallback) {
    const parts = [first, last].filter((s) => typeof s === "string" && s.trim().length > 0);
    if (parts.length > 0)
        return parts.join(" ");
    if (fallback && fallback.trim().length > 0)
        return fallback;
    return "Unnamed";
}
function projectStudent(row) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o;
    return {
        id: `student:${row.id}`,
        kind: "student",
        sourceId: row.id,
        tenantId: row.tenant_id,
        firstName: (_a = row.first_name) !== null && _a !== void 0 ? _a : null,
        lastName: (_b = row.last_name) !== null && _b !== void 0 ? _b : null,
        fullName: composeName(row.first_name, row.last_name),
        email: (_c = row.email) !== null && _c !== void 0 ? _c : null,
        phone: (_d = row.phone) !== null && _d !== void 0 ? _d : null,
        status: (_e = row.status) !== null && _e !== void 0 ? _e : null,
        stage: (_f = row.status) !== null && _f !== void 0 ? _f : null,
        familyId: (_g = row.family_id) !== null && _g !== void 0 ? _g : null,
        teacherId: (_h = row.teacher_id) !== null && _h !== void 0 ? _h : null,
        locationId: (_j = row.location_id) !== null && _j !== void 0 ? _j : null,
        tags: (_k = row.tags) !== null && _k !== void 0 ? _k : null,
        source: (_l = row.source) !== null && _l !== void 0 ? _l : null,
        createdAt: (_m = row.created_at) !== null && _m !== void 0 ? _m : null,
        updatedAt: (_o = row.updated_at) !== null && _o !== void 0 ? _o : null,
        archived: row.status === "inactive" ||
            row.status === "archived" ||
            Boolean(row.deactivated_at),
    };
}
function projectLead(row) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l;
    return {
        id: `lead:${row.id}`,
        kind: "lead",
        sourceId: row.id,
        tenantId: row.tenant_id,
        firstName: (_a = row.first_name) !== null && _a !== void 0 ? _a : null,
        lastName: (_b = row.last_name) !== null && _b !== void 0 ? _b : null,
        fullName: composeName(row.first_name, row.last_name),
        email: (_c = row.email) !== null && _c !== void 0 ? _c : null,
        phone: (_d = row.phone) !== null && _d !== void 0 ? _d : null,
        status: (_e = row.stage) !== null && _e !== void 0 ? _e : null,
        stage: (_f = row.stage) !== null && _f !== void 0 ? _f : null,
        familyId: (_g = row.family_id) !== null && _g !== void 0 ? _g : null,
        teacherId: null,
        locationId: (_h = row.location_id) !== null && _h !== void 0 ? _h : null,
        tags: null,
        source: (_j = row.source) !== null && _j !== void 0 ? _j : null,
        createdAt: (_k = row.created_at) !== null && _k !== void 0 ? _k : null,
        updatedAt: (_l = row.updated_at) !== null && _l !== void 0 ? _l : null,
        archived: row.stage === "lost",
    };
}
function projectFamily(row) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m;
    const fallback = (_c = (_b = (_a = row.primary_contact_name) !== null && _a !== void 0 ? _a : row.parent_name) !== null && _b !== void 0 ? _b : row.name) !== null && _c !== void 0 ? _c : null;
    return {
        id: `family:${row.id}`,
        kind: "family",
        sourceId: row.id,
        tenantId: row.tenant_id,
        firstName: (_d = row.parent_first_name) !== null && _d !== void 0 ? _d : null,
        lastName: (_e = row.parent_last_name) !== null && _e !== void 0 ? _e : null,
        fullName: composeName(row.parent_first_name, row.parent_last_name, fallback),
        email: (_f = row.primary_email) !== null && _f !== void 0 ? _f : null,
        phone: (_g = row.primary_phone) !== null && _g !== void 0 ? _g : null,
        status: (_h = row.billing_status) !== null && _h !== void 0 ? _h : null,
        stage: (_j = row.billing_status) !== null && _j !== void 0 ? _j : null,
        familyId: row.id,
        teacherId: null,
        locationId: (_k = row.primary_location_id) !== null && _k !== void 0 ? _k : null,
        tags: null,
        source: null,
        createdAt: (_l = row.created_at) !== null && _l !== void 0 ? _l : null,
        updatedAt: (_m = row.updated_at) !== null && _m !== void 0 ? _m : null,
        archived: row.billing_status === "archived",
    };
}
function projectTeacher(row) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j;
    return {
        id: `teacher:${row.id}`,
        kind: "teacher",
        sourceId: row.id,
        tenantId: row.tenant_id,
        firstName: (_a = row.first_name) !== null && _a !== void 0 ? _a : null,
        lastName: (_b = row.last_name) !== null && _b !== void 0 ? _b : null,
        fullName: composeName(row.first_name, row.last_name, (_c = row.display_name) !== null && _c !== void 0 ? _c : null),
        email: (_d = row.email) !== null && _d !== void 0 ? _d : null,
        phone: (_e = row.phone) !== null && _e !== void 0 ? _e : null,
        status: (_f = row.status) !== null && _f !== void 0 ? _f : null,
        stage: (_g = row.status) !== null && _g !== void 0 ? _g : null,
        familyId: null,
        teacherId: row.id,
        locationId: null,
        tags: null,
        source: null,
        createdAt: (_h = row.created_at) !== null && _h !== void 0 ? _h : null,
        updatedAt: (_j = row.updated_at) !== null && _j !== void 0 ? _j : null,
        archived: row.is_active === false,
    };
}
function kindsFromFilter(filter) {
    if (!(filter === null || filter === void 0 ? void 0 : filter.kind))
        return ["lead", "student", "family", "teacher"];
    return Array.isArray(filter.kind) ? filter.kind : [filter.kind];
}
export async function listContacts(tenantId, filter, limit = 200) {
    var _a;
    const supabase = clientFor(tenantId);
    const kinds = kindsFromFilter(filter);
    const results = [];
    const search = (_a = filter === null || filter === void 0 ? void 0 : filter.search) === null || _a === void 0 ? void 0 : _a.trim();
    if (kinds.includes("student")) {
        let q = supabase.from("students").select("*").eq("tenant_id", tenantId);
        if (filter === null || filter === void 0 ? void 0 : filter.familyId)
            q = q.eq("family_id", filter.familyId);
        if (filter === null || filter === void 0 ? void 0 : filter.teacherId)
            q = q.eq("teacher_id", filter.teacherId);
        if (filter === null || filter === void 0 ? void 0 : filter.locationId)
            q = q.eq("location_id", filter.locationId);
        if (filter === null || filter === void 0 ? void 0 : filter.status)
            q = q.eq("status", filter.status);
        if (search) {
            q = q.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`);
        }
        const { data, error } = await q.limit(limit);
        if (error)
            throw error;
        for (const row of (data !== null && data !== void 0 ? data : [])) {
            const c = projectStudent(row);
            if (!(filter === null || filter === void 0 ? void 0 : filter.includeArchived) && c.archived)
                continue;
            results.push(c);
        }
    }
    if (kinds.includes("lead")) {
        let q = supabase.from("leads").select("*").eq("tenant_id", tenantId);
        if (filter === null || filter === void 0 ? void 0 : filter.familyId)
            q = q.eq("family_id", filter.familyId);
        if (filter === null || filter === void 0 ? void 0 : filter.locationId)
            q = q.eq("location_id", filter.locationId);
        if (filter === null || filter === void 0 ? void 0 : filter.stage)
            q = q.eq("stage", filter.stage);
        if (search) {
            q = q.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`);
        }
        const { data, error } = await q.limit(limit);
        if (error)
            throw error;
        for (const row of (data !== null && data !== void 0 ? data : [])) {
            const c = projectLead(row);
            if (!(filter === null || filter === void 0 ? void 0 : filter.includeArchived) && c.archived)
                continue;
            results.push(c);
        }
    }
    if (kinds.includes("family")) {
        let q = supabase.from("families").select("*").eq("tenant_id", tenantId);
        if (filter === null || filter === void 0 ? void 0 : filter.locationId)
            q = q.eq("primary_location_id", filter.locationId);
        if (filter === null || filter === void 0 ? void 0 : filter.status)
            q = q.eq("billing_status", filter.status);
        if (search) {
            q = q.or(`name.ilike.%${search}%,primary_email.ilike.%${search}%,primary_phone.ilike.%${search}%,parent_name.ilike.%${search}%`);
        }
        const { data, error } = await q.limit(limit);
        if (error)
            throw error;
        for (const row of (data !== null && data !== void 0 ? data : [])) {
            const c = projectFamily(row);
            if (!(filter === null || filter === void 0 ? void 0 : filter.includeArchived) && c.archived)
                continue;
            results.push(c);
        }
    }
    if (kinds.includes("teacher")) {
        let q = supabase.from("teachers").select("*").eq("tenant_id", tenantId);
        if (filter === null || filter === void 0 ? void 0 : filter.status)
            q = q.eq("status", filter.status);
        if (search) {
            q = q.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%,display_name.ilike.%${search}%`);
        }
        const { data, error } = await q.limit(limit);
        if (error)
            throw error;
        for (const row of (data !== null && data !== void 0 ? data : [])) {
            const c = projectTeacher(row);
            if (!(filter === null || filter === void 0 ? void 0 : filter.includeArchived) && c.archived)
                continue;
            results.push(c);
        }
    }
    results.sort((a, b) => {
        var _a, _b;
        const ax = (_a = a.createdAt) !== null && _a !== void 0 ? _a : "";
        const bx = (_b = b.createdAt) !== null && _b !== void 0 ? _b : "";
        return bx.localeCompare(ax);
    });
    return results;
}
export async function getContactById(tenantId, contactId) {
    const [kind, sourceId] = contactId.split(":");
    if (!kind || !sourceId)
        return null;
    const supabase = clientFor(tenantId);
    switch (kind) {
        case "student": {
            const { data, error } = await supabase
                .from("students")
                .select("*")
                .eq("tenant_id", tenantId)
                .eq("id", sourceId)
                .maybeSingle();
            if (error)
                throw error;
            return data ? projectStudent(data) : null;
        }
        case "lead": {
            const { data, error } = await supabase
                .from("leads")
                .select("*")
                .eq("tenant_id", tenantId)
                .eq("id", sourceId)
                .maybeSingle();
            if (error)
                throw error;
            return data ? projectLead(data) : null;
        }
        case "family": {
            const { data, error } = await supabase
                .from("families")
                .select("*")
                .eq("tenant_id", tenantId)
                .eq("id", sourceId)
                .maybeSingle();
            if (error)
                throw error;
            return data ? projectFamily(data) : null;
        }
        case "teacher": {
            const { data, error } = await supabase
                .from("teachers")
                .select("*")
                .eq("tenant_id", tenantId)
                .eq("id", sourceId)
                .maybeSingle();
            if (error)
                throw error;
            return data ? projectTeacher(data) : null;
        }
        default:
            return null;
    }
}
/**
 * Create a contact — dispatches to the underlying entity facade
 * based on {@link CreateContactInput.kind}.
 */
export async function createContact(tenantId, input) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z, _0;
    const supabase = clientFor(tenantId);
    switch (input.kind) {
        case "lead": {
            const { data, error } = await supabase
                .from("leads")
                .insert({
                tenant_id: tenantId,
                first_name: (_a = input.firstName) !== null && _a !== void 0 ? _a : "",
                last_name: (_b = input.lastName) !== null && _b !== void 0 ? _b : null,
                email: (_c = input.email) !== null && _c !== void 0 ? _c : null,
                phone: (_d = input.phone) !== null && _d !== void 0 ? _d : null,
                family_id: (_e = input.familyId) !== null && _e !== void 0 ? _e : null,
                location_id: (_f = input.locationId) !== null && _f !== void 0 ? _f : null,
                source: (_g = input.source) !== null && _g !== void 0 ? _g : null,
                stage: "new",
            })
                .select("*")
                .single();
            if (error)
                throw error;
            return projectLead(data);
        }
        case "student": {
            const { data, error } = await supabase
                .from("students")
                .insert({
                tenant_id: tenantId,
                first_name: (_h = input.firstName) !== null && _h !== void 0 ? _h : "",
                last_name: (_j = input.lastName) !== null && _j !== void 0 ? _j : "",
                email: (_k = input.email) !== null && _k !== void 0 ? _k : null,
                phone: (_l = input.phone) !== null && _l !== void 0 ? _l : null,
                family_id: (_m = input.familyId) !== null && _m !== void 0 ? _m : null,
                location_id: (_o = input.locationId) !== null && _o !== void 0 ? _o : null,
                source: (_p = input.source) !== null && _p !== void 0 ? _p : null,
                status: "prospect",
                tags: (_q = input.tags) !== null && _q !== void 0 ? _q : null,
                notes: (_r = input.notes) !== null && _r !== void 0 ? _r : null,
            })
                .select("*")
                .single();
            if (error)
                throw error;
            return projectStudent(data);
        }
        case "family": {
            const name = [input.firstName, input.lastName]
                .filter((s) => Boolean(s && s.length > 0))
                .join(" ")
                .trim();
            const { data, error } = await supabase
                .from("families")
                .insert({
                tenant_id: tenantId,
                name: name || "New Family",
                parent_first_name: (_s = input.firstName) !== null && _s !== void 0 ? _s : null,
                parent_last_name: (_t = input.lastName) !== null && _t !== void 0 ? _t : null,
                primary_email: (_u = input.email) !== null && _u !== void 0 ? _u : null,
                primary_phone: (_v = input.phone) !== null && _v !== void 0 ? _v : null,
                primary_location_id: (_w = input.locationId) !== null && _w !== void 0 ? _w : null,
            })
                .select("*")
                .single();
            if (error)
                throw error;
            return projectFamily(data);
        }
        case "teacher": {
            const { data, error } = await supabase
                .from("teachers")
                .insert({
                tenant_id: tenantId,
                first_name: (_x = input.firstName) !== null && _x !== void 0 ? _x : null,
                last_name: (_y = input.lastName) !== null && _y !== void 0 ? _y : null,
                email: (_z = input.email) !== null && _z !== void 0 ? _z : null,
                phone: (_0 = input.phone) !== null && _0 !== void 0 ? _0 : null,
                instruments: [],
                status: "onboarding",
                is_active: true,
            })
                .select("*")
                .single();
            if (error)
                throw error;
            return projectTeacher(data);
        }
        default: {
            const never = input.kind;
            throw new Error(`Unsupported contact kind: ${String(never)}`);
        }
    }
}
export async function updateContact(tenantId, contactId, input) {
    const [kind, sourceId] = contactId.split(":");
    if (!kind || !sourceId)
        return null;
    const supabase = clientFor(tenantId);
    const nameFields = {};
    if (input.firstName !== undefined)
        nameFields.first_name = input.firstName;
    if (input.lastName !== undefined)
        nameFields.last_name = input.lastName;
    switch (kind) {
        case "student": {
            const patch = Object.assign({}, nameFields);
            if (input.email !== undefined)
                patch.email = input.email;
            if (input.phone !== undefined)
                patch.phone = input.phone;
            if (input.status !== undefined)
                patch.status = input.status;
            if (input.tags !== undefined)
                patch.tags = input.tags;
            if (input.notes !== undefined)
                patch.notes = input.notes;
            patch.updated_at = new Date().toISOString();
            const { data, error } = await supabase
                .from("students")
                .update(patch)
                .eq("tenant_id", tenantId)
                .eq("id", sourceId)
                .select("*")
                .single();
            if (error)
                throw error;
            return projectStudent(data);
        }
        case "lead": {
            const patch = Object.assign({}, nameFields);
            if (input.email !== undefined)
                patch.email = input.email;
            if (input.phone !== undefined)
                patch.phone = input.phone;
            if (input.status !== undefined)
                patch.stage = input.status;
            patch.updated_at = new Date().toISOString();
            const { data, error } = await supabase
                .from("leads")
                .update(patch)
                .eq("tenant_id", tenantId)
                .eq("id", sourceId)
                .select("*")
                .single();
            if (error)
                throw error;
            return projectLead(data);
        }
        case "family": {
            const patch = {};
            if (input.firstName !== undefined)
                patch.parent_first_name = input.firstName;
            if (input.lastName !== undefined)
                patch.parent_last_name = input.lastName;
            if (input.email !== undefined)
                patch.primary_email = input.email;
            if (input.phone !== undefined)
                patch.primary_phone = input.phone;
            if (input.status !== undefined)
                patch.billing_status = input.status;
            patch.updated_at = new Date().toISOString();
            const { data, error } = await supabase
                .from("families")
                .update(patch)
                .eq("tenant_id", tenantId)
                .eq("id", sourceId)
                .select("*")
                .single();
            if (error)
                throw error;
            return projectFamily(data);
        }
        case "teacher": {
            const patch = Object.assign({}, nameFields);
            if (input.email !== undefined)
                patch.email = input.email;
            if (input.phone !== undefined)
                patch.phone = input.phone;
            if (input.status !== undefined)
                patch.status = input.status;
            patch.updated_at = new Date().toISOString();
            const { data, error } = await supabase
                .from("teachers")
                .update(patch)
                .eq("tenant_id", tenantId)
                .eq("id", sourceId)
                .select("*")
                .single();
            if (error)
                throw error;
            return projectTeacher(data);
        }
        default:
            return null;
    }
}
export async function archiveContact(tenantId, contactId) {
    const [kind, sourceId] = contactId.split(":");
    if (!kind || !sourceId)
        return;
    const supabase = clientFor(tenantId);
    const nowIso = new Date().toISOString();
    switch (kind) {
        case "student":
            await supabase
                .from("students")
                .update({
                status: "inactive",
                deactivated_at: nowIso,
                updated_at: nowIso,
            })
                .eq("tenant_id", tenantId)
                .eq("id", sourceId);
            return;
        case "lead":
            await supabase
                .from("leads")
                .update({ stage: "lost", updated_at: nowIso })
                .eq("tenant_id", tenantId)
                .eq("id", sourceId);
            return;
        case "family":
            await supabase
                .from("families")
                .update({ billing_status: "archived", updated_at: nowIso })
                .eq("tenant_id", tenantId)
                .eq("id", sourceId);
            return;
        case "teacher":
            await supabase
                .from("teachers")
                .update({
                status: "inactive",
                is_active: false,
                termination_date: nowIso,
                updated_at: nowIso,
            })
                .eq("tenant_id", tenantId)
                .eq("id", sourceId);
            return;
    }
}
/**
 * Merge two contacts of the same kind. Keeps the `keep` contact and
 * soft-archives the `remove` contact, copying non-empty fields forward.
 * For student/family/teacher merges we re-parent child rows where
 * straightforward.
 */
export async function mergeContacts(tenantId, keepContactId, removeContactId) {
    const [keepKind, keepId] = keepContactId.split(":");
    const [removeKind, removeId] = removeContactId.split(":");
    if (!keepKind || !keepId || !removeKind || !removeId)
        return null;
    if (keepKind !== removeKind) {
        throw new Error(`Cannot merge contacts of different kinds: ${keepKind} vs ${removeKind}`);
    }
    const supabase = clientFor(tenantId);
    const keep = await getContactById(tenantId, keepContactId);
    const remove = await getContactById(tenantId, removeContactId);
    if (!keep || !remove)
        return keep;
    const patch = {};
    if (!keep.email && remove.email)
        patch.email = remove.email;
    if (!keep.phone && remove.phone)
        patch.phone = remove.phone;
    if (!keep.firstName && remove.firstName)
        patch.firstName = remove.firstName;
    if (!keep.lastName && remove.lastName)
        patch.lastName = remove.lastName;
    const merged = Object.keys(patch).length
        ? await updateContact(tenantId, keepContactId, patch)
        : keep;
    if (keepKind === "family") {
        await supabase
            .from("students")
            .update({ family_id: keepId, updated_at: new Date().toISOString() })
            .eq("tenant_id", tenantId)
            .eq("family_id", removeId);
    }
    await archiveContact(tenantId, removeContactId);
    return merged;
}
