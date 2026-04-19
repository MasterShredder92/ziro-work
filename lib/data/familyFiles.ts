import { clientFor } from "./_client";

const TABLE = "family_files";

export type FamilyFileRow = {
  id: string;
  tenant_id: string;
  family_id: string;
  file_type: string | null;
  file_name: string | null;
  file_url: string | null;
  file_size_bytes: number | null;
  uploaded_by: string | null;
  notes: string | null;
  created_at: string;
  signwell_document_id: string | null;
  signwell_status: string | null;
  source: string | null;
};

export async function listFilesForFamily(
  tenantId: string,
  familyId: string,
): Promise<FamilyFileRow[]> {
  const supabase = clientFor(tenantId);
  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("family_id", familyId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as FamilyFileRow[];
}
