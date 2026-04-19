"use server";

import { updateCrmRow, type CrmInlineResource } from "./updateCrmRow";

export async function updateCrmRowAction(
  resource: CrmInlineResource,
  id: string,
  patch: Record<string, unknown>,
) {
  return await updateCrmRow(resource, id, patch);
}
