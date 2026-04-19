export type CRMListBulkResource =
  | "contacts"
  | "students"
  | "families"
  | "teachers"
  | "enrollments";

export async function deleteCrmRow(
  resource: CRMListBulkResource,
  id: string,
): Promise<Response> {
  const enc = encodeURIComponent(id);
  let path: string;
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

export async function deleteManyCrmRows(
  resource: CRMListBulkResource,
  ids: string[],
): Promise<{ ok: string[]; failed: Array<{ id: string; status: number }> }> {
  const ok: string[] = [];
  const failed: Array<{ id: string; status: number }> = [];
  for (const id of ids) {
    const res = await deleteCrmRow(resource, id);
    if (res.ok || res.status === 204) ok.push(id);
    else failed.push({ id, status: res.status });
  }
  return { ok, failed };
}
