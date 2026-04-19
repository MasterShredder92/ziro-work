import { clientFor } from "./_client";

export type TemplateRow = {
  id: string;
  tenant_id: string;
  name: string;
  slug: string | null;
  description: string | null;
  category: string;
  channel: string;
  subject: string | null;
  body: string;
  current_version: number;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
};

export type TemplateInsert = Omit<
  TemplateRow,
  "id" | "created_at" | "updated_at"
> & {
  id?: string;
  created_at?: string;
  updated_at?: string;
};

export type TemplateVersionRow = {
  id: string;
  tenant_id: string;
  template_id: string;
  version: number;
  subject: string | null;
  body: string;
  change_summary: string | null;
  is_current: boolean;
  created_at: string;
  created_by: string | null;
};

export type TemplateVersionInsert = Omit<
  TemplateVersionRow,
  "id" | "created_at"
> & {
  id?: string;
  created_at?: string;
};

const TEMPLATES_TABLE = "templates";
const TEMPLATE_VERSIONS_TABLE = "template_versions";

type GlobalWithCache = typeof globalThis & {
  __ziro_templates_store?: Map<string, TemplateRow>;
  __ziro_template_versions_store?: Map<string, TemplateVersionRow>;
  __ziro_templates_db_missing?: boolean;
  __ziro_template_versions_db_missing?: boolean;
};

const g = globalThis as GlobalWithCache;

function templateStore(): Map<string, TemplateRow> {
  if (!g.__ziro_templates_store) {
    g.__ziro_templates_store = new Map();
  }
  return g.__ziro_templates_store;
}

function versionStore(): Map<string, TemplateVersionRow> {
  if (!g.__ziro_template_versions_store) {
    g.__ziro_template_versions_store = new Map();
  }
  return g.__ziro_template_versions_store;
}

function isMissingTableError(err: unknown, table: string): boolean {
  if (!err || typeof err !== "object") return false;
  const rec = err as Record<string, unknown>;
  const code = typeof rec.code === "string" ? rec.code : null;
  const message = typeof rec.message === "string" ? rec.message : "";
  if (code === "42P01") return true;
  if (code === "PGRST205") return true;
  if (new RegExp(`relation .*${table}.* does not exist`, "i").test(message)) return true;
  if (new RegExp(`Could not find the table .*${table}`, "i").test(message)) return true;
  return false;
}

function markTemplatesMissing(): void {
  g.__ziro_templates_db_missing = true;
}

function markVersionsMissing(): void {
  g.__ziro_template_versions_db_missing = true;
}

function templatesMissing(): boolean {
  return g.__ziro_templates_db_missing === true;
}

function versionsMissing(): boolean {
  return g.__ziro_template_versions_db_missing === true;
}

function newId(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`;
}

function nowIso(): string {
  return new Date().toISOString();
}

function normalizeTemplate(input: Partial<TemplateRow>): TemplateRow {
  const id = input.id ?? newId("tpl");
  const now = nowIso();
  return {
    id,
    tenant_id: String(input.tenant_id ?? ""),
    name: String(input.name ?? "Untitled template"),
    slug: input.slug ?? null,
    description: input.description ?? null,
    category: input.category ?? "general",
    channel: input.channel ?? "email",
    subject: input.subject ?? null,
    body: String(input.body ?? ""),
    current_version:
      typeof input.current_version === "number" && input.current_version > 0
        ? input.current_version
        : 1,
    is_archived: input.is_archived === true,
    created_at: input.created_at ?? now,
    updated_at: input.updated_at ?? now,
    created_by: input.created_by ?? null,
    updated_by: input.updated_by ?? null,
  };
}

function normalizeVersion(input: Partial<TemplateVersionRow>): TemplateVersionRow {
  const id = input.id ?? newId("tplv");
  const now = nowIso();
  return {
    id,
    tenant_id: String(input.tenant_id ?? ""),
    template_id: String(input.template_id ?? ""),
    version: typeof input.version === "number" ? input.version : 1,
    subject: input.subject ?? null,
    body: String(input.body ?? ""),
    change_summary: input.change_summary ?? null,
    is_current: input.is_current === true,
    created_at: input.created_at ?? now,
    created_by: input.created_by ?? null,
  };
}

export type TemplateFilter = {
  category?: string;
  channel?: string;
  includeArchived?: boolean;
};

export async function listTemplates(
  tenantId: string,
  filter?: TemplateFilter,
): Promise<TemplateRow[]> {
  const includeArchived = filter?.includeArchived === true;

  if (!templatesMissing()) {
    try {
      const supabase = clientFor(tenantId);
      let query = supabase
        .from(TEMPLATES_TABLE)
        .select("*")
        .eq("tenant_id", tenantId);
      if (filter?.category) query = query.eq("category", filter.category);
      if (filter?.channel) query = query.eq("channel", filter.channel);
      if (!includeArchived) query = query.eq("is_archived", false);
      const { data, error } = await query.order("updated_at", {
        ascending: false,
      });
      if (!error) return (data ?? []) as TemplateRow[];
      if (isMissingTableError(error, "templates")) {
        markTemplatesMissing();
      } else {
        throw error;
      }
    } catch (err) {
      if (isMissingTableError(err, "templates")) {
        markTemplatesMissing();
      } else {
        throw err;
      }
    }
  }

  let rows = Array.from(templateStore().values()).filter(
    (r) => r.tenant_id === tenantId,
  );
  if (filter?.category) rows = rows.filter((r) => r.category === filter.category);
  if (filter?.channel) rows = rows.filter((r) => r.channel === filter.channel);
  if (!includeArchived) rows = rows.filter((r) => !r.is_archived);
  return rows.sort((a, b) => b.updated_at.localeCompare(a.updated_at));
}

export async function getTemplate(
  templateId: string,
  tenantId: string,
): Promise<TemplateRow | null> {
  if (!templatesMissing()) {
    try {
      const supabase = clientFor(tenantId);
      const { data, error } = await supabase
        .from(TEMPLATES_TABLE)
        .select("*")
        .eq("tenant_id", tenantId)
        .eq("id", templateId)
        .maybeSingle();
      if (!error) return (data ?? null) as TemplateRow | null;
      if (isMissingTableError(error, "templates")) {
        markTemplatesMissing();
      } else {
        throw error;
      }
    } catch (err) {
      if (isMissingTableError(err, "templates")) {
        markTemplatesMissing();
      } else {
        throw err;
      }
    }
  }

  const row = templateStore().get(templateId);
  if (!row) return null;
  if (row.tenant_id !== tenantId) return null;
  return row;
}

export async function upsertTemplate(
  tenantId: string,
  input: Partial<TemplateRow> & { name: string; body: string },
): Promise<TemplateRow> {
  const row = normalizeTemplate({
    ...input,
    tenant_id: tenantId,
    updated_at: nowIso(),
  });

  if (!templatesMissing()) {
    try {
      const supabase = clientFor(tenantId);
      const { data, error } = await supabase
        .from(TEMPLATES_TABLE)
        .upsert(row, { onConflict: "id" })
        .select("*")
        .single();
      if (!error && data) return data as TemplateRow;
      if (error && isMissingTableError(error, "templates")) {
        markTemplatesMissing();
      } else if (error) {
        throw error;
      }
    } catch (err) {
      if (isMissingTableError(err, "templates")) {
        markTemplatesMissing();
      } else {
        throw err;
      }
    }
  }

  templateStore().set(row.id, row);
  return row;
}

export async function deleteTemplate(
  templateId: string,
  tenantId: string,
): Promise<void> {
  if (!templatesMissing()) {
    try {
      const supabase = clientFor(tenantId);
      const { error } = await supabase
        .from(TEMPLATES_TABLE)
        .delete()
        .eq("tenant_id", tenantId)
        .eq("id", templateId);
      if (!error) return;
      if (isMissingTableError(error, "templates")) {
        markTemplatesMissing();
      } else {
        throw error;
      }
    } catch (err) {
      if (isMissingTableError(err, "templates")) {
        markTemplatesMissing();
      } else {
        throw err;
      }
    }
  }

  const row = templateStore().get(templateId);
  if (row && row.tenant_id === tenantId) {
    templateStore().delete(templateId);
  }
}

export async function listTemplateVersions(
  templateId: string,
  tenantId: string,
): Promise<TemplateVersionRow[]> {
  if (!versionsMissing()) {
    try {
      const supabase = clientFor(tenantId);
      const { data, error } = await supabase
        .from(TEMPLATE_VERSIONS_TABLE)
        .select("*")
        .eq("tenant_id", tenantId)
        .eq("template_id", templateId)
        .order("version", { ascending: false });
      if (!error) return (data ?? []) as TemplateVersionRow[];
      if (isMissingTableError(error, "template_versions")) {
        markVersionsMissing();
      } else {
        throw error;
      }
    } catch (err) {
      if (isMissingTableError(err, "template_versions")) {
        markVersionsMissing();
      } else {
        throw err;
      }
    }
  }

  const rows = Array.from(versionStore().values()).filter(
    (r) => r.tenant_id === tenantId && r.template_id === templateId,
  );
  return rows.sort((a, b) => b.version - a.version);
}

export async function getTemplateVersion(
  versionId: string,
  tenantId: string,
): Promise<TemplateVersionRow | null> {
  if (!versionsMissing()) {
    try {
      const supabase = clientFor(tenantId);
      const { data, error } = await supabase
        .from(TEMPLATE_VERSIONS_TABLE)
        .select("*")
        .eq("tenant_id", tenantId)
        .eq("id", versionId)
        .maybeSingle();
      if (!error) return (data ?? null) as TemplateVersionRow | null;
      if (isMissingTableError(error, "template_versions")) {
        markVersionsMissing();
      } else {
        throw error;
      }
    } catch (err) {
      if (isMissingTableError(err, "template_versions")) {
        markVersionsMissing();
      } else {
        throw err;
      }
    }
  }

  const row = versionStore().get(versionId);
  if (!row) return null;
  if (row.tenant_id !== tenantId) return null;
  return row;
}

export async function upsertTemplateVersion(
  tenantId: string,
  input: Partial<TemplateVersionRow> & { template_id: string; body: string },
): Promise<TemplateVersionRow> {
  const row = normalizeVersion({
    ...input,
    tenant_id: tenantId,
  });

  if (!versionsMissing()) {
    try {
      const supabase = clientFor(tenantId);
      const { data, error } = await supabase
        .from(TEMPLATE_VERSIONS_TABLE)
        .upsert(row, { onConflict: "id" })
        .select("*")
        .single();
      if (!error && data) return data as TemplateVersionRow;
      if (error && isMissingTableError(error, "template_versions")) {
        markVersionsMissing();
      } else if (error) {
        throw error;
      }
    } catch (err) {
      if (isMissingTableError(err, "template_versions")) {
        markVersionsMissing();
      } else {
        throw err;
      }
    }
  }

  versionStore().set(row.id, row);
  return row;
}

export async function markVersionCurrent(
  templateId: string,
  versionId: string,
  tenantId: string,
): Promise<void> {
  const versions = await listTemplateVersions(templateId, tenantId);
  for (const v of versions) {
    const shouldBeCurrent = v.id === versionId;
    if (v.is_current !== shouldBeCurrent) {
      await upsertTemplateVersion(tenantId, {
        ...v,
        is_current: shouldBeCurrent,
      });
    }
  }
}
