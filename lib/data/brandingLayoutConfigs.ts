import { clientFor, applyListOptions, type ListOptions } from "./_client";
import {
  isMissingTableError,
  markTableMissing,
  tableMissing,
} from "./_missingTable";

const TABLE = "branding_layout_configs";

export type PortalScope = "student" | "family" | "teacher" | "director" | "admin";

export type LayoutPreset = "classic" | "compact" | "minimal";
export type SidebarVariant = "icons_only" | "icons_labels" | "collapsible";
export type DashboardPreset = "grid" | "focus" | "feed";

export type WidgetSlot = {
  id: string;
  title: string;
  size: "sm" | "md" | "lg" | "full";
  source?: string | null;
};

export type BrandingLayoutConfigRow = {
  id: string;
  tenant_id: string;
  scope: PortalScope;
  preset: LayoutPreset;
  sidebar_variant: SidebarVariant;
  dashboard_preset: DashboardPreset;
  widgets: WidgetSlot[];
  header_extras: string[];
  footer_extras: string[];
  created_at: string;
  updated_at: string;
};

type GlobalStore = typeof globalThis & {
  __ziro_branding_layouts_store?: Map<string, BrandingLayoutConfigRow>;
};

const g = globalThis as GlobalStore;
function store(): Map<string, BrandingLayoutConfigRow> {
  if (!g.__ziro_branding_layouts_store) g.__ziro_branding_layouts_store = new Map();
  return g.__ziro_branding_layouts_store;
}

function nowIso(): string {
  return new Date().toISOString();
}

function newId(): string {
  return `lay_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`;
}

function defaultWidgets(scope: PortalScope): WidgetSlot[] {
  switch (scope) {
    case "student":
      return [
        { id: "next-lesson", title: "Next lesson", size: "md" },
        { id: "assignments", title: "Assignments", size: "md" },
        { id: "progress", title: "Progress", size: "lg" },
        { id: "messages", title: "Messages", size: "sm" },
      ];
    case "family":
      return [
        { id: "students", title: "Students", size: "md" },
        { id: "schedule", title: "Schedule", size: "md" },
        { id: "billing", title: "Billing", size: "md" },
        { id: "messages", title: "Messages", size: "sm" },
      ];
    case "teacher":
      return [
        { id: "today", title: "Today's lessons", size: "lg" },
        { id: "roster", title: "Roster", size: "md" },
        { id: "followups", title: "Follow-ups", size: "md" },
        { id: "inbox", title: "Inbox", size: "sm" },
      ];
    case "director":
      return [
        { id: "kpis", title: "KPIs", size: "lg" },
        { id: "enrollments", title: "Enrollments", size: "md" },
        { id: "revenue", title: "Revenue", size: "md" },
        { id: "schedule-heat", title: "Schedule heat", size: "lg" },
      ];
    case "admin":
      return [
        { id: "tenant-health", title: "Tenant health", size: "lg" },
        { id: "users", title: "Users & roles", size: "md" },
        { id: "audit", title: "Audit", size: "md" },
        { id: "branding", title: "Branding", size: "sm" },
      ];
  }
}

function normalizeRow(
  input: Partial<BrandingLayoutConfigRow>,
): BrandingLayoutConfigRow {
  const id = input.id ?? newId();
  const now = nowIso();
  const scope = (input.scope ?? "teacher") as PortalScope;
  return {
    id,
    tenant_id: String(input.tenant_id ?? ""),
    scope,
    preset: (input.preset ?? "classic") as LayoutPreset,
    sidebar_variant: (input.sidebar_variant ?? "icons_labels") as SidebarVariant,
    dashboard_preset: (input.dashboard_preset ?? "grid") as DashboardPreset,
    widgets: Array.isArray(input.widgets) && input.widgets.length > 0
      ? input.widgets
      : defaultWidgets(scope),
    header_extras: Array.isArray(input.header_extras) ? input.header_extras : [],
    footer_extras: Array.isArray(input.footer_extras) ? input.footer_extras : [],
    created_at: input.created_at ?? now,
    updated_at: input.updated_at ?? now,
  };
}

export const PORTAL_SCOPES: PortalScope[] = [
  "student",
  "family",
  "teacher",
  "director",
  "admin",
];

export async function listBrandingLayouts(
  tenantId: string,
  opts?: ListOptions,
): Promise<BrandingLayoutConfigRow[]> {
  if (!tableMissing(TABLE)) {
    try {
      const supabase = clientFor(tenantId);
      const query = supabase.from(TABLE).select("*").eq("tenant_id", tenantId);
      const ordered = applyListOptions(query, {
        orderBy: opts?.orderBy ?? "updated_at",
        ascending: opts?.ascending ?? false,
        limit: opts?.limit ?? 100,
        offset: opts?.offset,
      });
      const { data, error } = await ordered;
      if (!error) return (data ?? []) as BrandingLayoutConfigRow[];
      if (isMissingTableError(error, TABLE)) markTableMissing(TABLE);
      else throw error;
    } catch (err) {
      if (isMissingTableError(err, TABLE)) markTableMissing(TABLE);
      else throw err;
    }
  }
  return Array.from(store().values())
    .filter((r) => r.tenant_id === tenantId)
    .sort((a, b) => a.scope.localeCompare(b.scope));
}

export async function getBrandingLayout(
  scope: PortalScope,
  tenantId: string,
): Promise<BrandingLayoutConfigRow | null> {
  const rows = await listBrandingLayouts(tenantId);
  return rows.find((r) => r.scope === scope) ?? null;
}

export async function upsertBrandingLayout(
  tenantId: string,
  input: Partial<BrandingLayoutConfigRow> & { scope: PortalScope },
): Promise<BrandingLayoutConfigRow> {
  const existing = await getBrandingLayout(input.scope, tenantId);
  const row = normalizeRow({
    ...(existing ?? {}),
    ...input,
    tenant_id: tenantId,
    updated_at: nowIso(),
  });

  if (!tableMissing(TABLE)) {
    try {
      const supabase = clientFor(tenantId);
      const { data, error } = await supabase
        .from(TABLE)
        .upsert(row, { onConflict: "tenant_id,scope" })
        .select("*")
        .single();
      if (!error && data) {
        store().set(row.id, data as BrandingLayoutConfigRow);
        return data as BrandingLayoutConfigRow;
      }
      if (error && isMissingTableError(error, TABLE)) markTableMissing(TABLE);
      else if (error) throw error;
    } catch (err) {
      if (isMissingTableError(err, TABLE)) markTableMissing(TABLE);
      else throw err;
    }
  }

  store().set(row.id, row);
  return row;
}

export async function deleteBrandingLayout(
  id: string,
  tenantId: string,
): Promise<boolean> {
  if (!tableMissing(TABLE)) {
    try {
      const supabase = clientFor(tenantId);
      const { error } = await supabase
        .from(TABLE)
        .delete()
        .eq("id", id)
        .eq("tenant_id", tenantId);
      if (!error) {
        store().delete(id);
        return true;
      }
      if (isMissingTableError(error, TABLE)) markTableMissing(TABLE);
      else throw error;
    } catch (err) {
      if (isMissingTableError(err, TABLE)) markTableMissing(TABLE);
      else throw err;
    }
  }
  const existing = store().get(id);
  if (existing && existing.tenant_id === tenantId) {
    store().delete(id);
    return true;
  }
  return false;
}
