"use server";
import { updateCrmRow } from "./updateCrmRow";
export async function updateCrmRowAction(resource, id, patch) {
    return await updateCrmRow(resource, id, patch);
}
