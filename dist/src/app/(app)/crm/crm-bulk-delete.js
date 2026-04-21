export async function deleteCrmRow(resource, id) {
    const enc = encodeURIComponent(id);
    let path;
    switch (resource) {
        case "contacts":
            path = `/api/crm/contacts/${enc}`;
            break;
        case "students":
            path = `/api/crm/students/${enc}`;
            break;
        case "families":
            path = `/api/crm/families/${enc}`;
            break;
        case "teachers":
            path = `/api/crm/teachers/${enc}`;
            break;
        case "enrollments":
            path = `/api/crm/enrollments/${enc}`;
            break;
        default:
            throw new Error("Unknown resource");
    }
    return fetch(path, {
        method: "DELETE",
        credentials: "same-origin",
        headers: { Accept: "application/json" },
    });
}
export async function deleteManyCrmRows(resource, ids) {
    const ok = [];
    const failed = [];
    for (const id of ids) {
        const res = await deleteCrmRow(resource, id);
        if (res.ok || res.status === 204)
            ok.push(id);
        else
            failed.push({ id, status: res.status });
    }
    return { ok, failed };
}
