/**
 * Reporting OS — shared type contracts.
 *
 * Consumed by the report definition registry, the runtime service,
 * the API routes, and the UI renderers. No runtime side effects.
 */

// ---------------------------------------------------------------------------
// Built-in report kinds (legacy registry at src/lib/reports/definitions.ts)
// ---------------------------------------------------------------------------

export type ReportKind =
  | "enrollment"
  | "revenue"
  | "attendance"
  | "teacherLoad"
  | "leadConversion";

/** Extended kind that also covers user-authored custom reports. */
export type ExtendedReportKind = ReportKind | "custom";

export type ReportParameterType =
  | "string"
  | "number"
  | "boolean"
  | "date"
  | "dateRange"
  | "select";

export type ReportParameterOption = {
  value: string;
  label: string;
};

export type ReportParameter = {
  key: string;
  label: string;
  type: ReportParameterType;
  description?: string;
  required?: boolean;
  defaultValue?: unknown;
  options?: ReportParameterOption[];
  placeholder?: string;
};

/** ISO date range, yyyy-mm-dd inclusive. */
export type ReportRange = {
  from: string;
  to: string;
};

export type ReportContext = {
  tenantId: string;
  profileId?: string | null;
  role?: string | null;
  range: ReportRange;
  params: Record<string, unknown>;
};

export type ReportColumnFormat =
  | "text"
  | "number"
  | "currency"
  | "percent"
  | "date";

export type ReportColumn = {
  key: string;
  label: string;
  align?: "left" | "center" | "right";
  format?: ReportColumnFormat;
  width?: string;
};

export type ReportChartType = "bar" | "line" | "pie";

export type ReportChartPoint = {
  x: string | number;
  y: number;
  label?: string;
};

export type ReportChartSeries = {
  id: string;
  label: string;
  data: ReportChartPoint[];
};

export type ReportChart = {
  type: ReportChartType;
  title?: string;
  xLabel?: string;
  yLabel?: string;
  series: ReportChartSeries[];
};

export type ReportSummaryFormat =
  | "number"
  | "currency"
  | "percent"
  | "text";

export type ReportSummaryMetric = {
  key: string;
  label: string;
  value: number | string;
  format?: ReportSummaryFormat;
  sublabel?: string;
};

export type ReportResult = {
  reportId: string;
  reportKind: ReportKind;
  name: string;
  generatedAt: string;
  range: ReportRange;
  tenantId: string;
  summary: ReportSummaryMetric[];
  columns: ReportColumn[];
  rows: Array<Record<string, unknown>>;
  chart?: ReportChart | null;
  meta?: Record<string, unknown>;
  /** Optional tenant PDF branding (footer / watermark text). */
  pdfExportBranding?: {
    footerText?: string | null;
    watermark?: string | null;
  };
};

export type ReportExecution = {
  reportId: string;
  tenantId: string;
  profileId?: string | null;
  startedAt: string;
  endedAt: string;
  durationMs: number;
  ok: boolean;
  error?: { message: string; code?: string };
};

export type ReportDefinition = {
  id: ReportKind;
  name: string;
  description: string;
  parameters: ReportParameter[];
  run: (context: ReportContext) => Promise<ReportResult>;
};

export type ReportDefinitionSummary = Pick<
  ReportDefinition,
  "id" | "name" | "description" | "parameters"
>;

/** Standard strongly-typed report shapes. */
export type EnrollmentReport = ReportResult & { reportKind: "enrollment" };
export type RevenueReport = ReportResult & { reportKind: "revenue" };
export type AttendanceReport = ReportResult & { reportKind: "attendance" };
export type TeacherLoadReport = ReportResult & { reportKind: "teacherLoad" };
export type LeadConversionReport = ReportResult & {
  reportKind: "leadConversion";
};

export const REPORT_KIND_LIST: ReportKind[] = [
  "enrollment",
  "revenue",
  "attendance",
  "teacherLoad",
  "leadConversion",
];

// ---------------------------------------------------------------------------
// Query engine contracts
// ---------------------------------------------------------------------------

export type ReportSource =
  | "students"
  | "families"
  | "teachers"
  | "leads"
  | "schedule_blocks"
  | "lesson_events"
  | "attendance_sessions"
  | "invoices"
  | "payments"
  | "subscriptions"
  | "progress_goals"
  | "progress_skills"
  | "progress_checkpoints"
  | "progress_evidence"
  | "assessments"
  | "assessment_attempts"
  | "forms"
  | "form_submissions"
  | "message_threads"
  | "messages"
  | "automation_runs"
  | "automation_logs";

export const REPORT_SOURCES: ReportSource[] = [
  "students",
  "families",
  "teachers",
  "leads",
  "schedule_blocks",
  "lesson_events",
  "attendance_sessions",
  "invoices",
  "payments",
  "subscriptions",
  "progress_goals",
  "progress_skills",
  "progress_checkpoints",
  "progress_evidence",
  "assessments",
  "assessment_attempts",
  "forms",
  "form_submissions",
  "message_threads",
  "messages",
  "automation_runs",
  "automation_logs",
];

export type FilterOp =
  | "eq"
  | "neq"
  | "gt"
  | "gte"
  | "lt"
  | "lte"
  | "in"
  | "notIn"
  | "contains"
  | "isNull"
  | "isNotNull";

export type ReportFilter = {
  field: string;
  op: FilterOp;
  value?: unknown;
};

export type AggregateOp =
  | "count"
  | "countDistinct"
  | "sum"
  | "avg"
  | "min"
  | "max";

export type ReportAggregate = {
  key: string;
  field?: string;
  op: AggregateOp;
  format?: ReportColumnFormat;
};

export type DateBucket = "day" | "week" | "month" | "quarter" | "year";

export type ReportGroupBy = {
  field: string;
  dateBucket?: DateBucket;
  alias?: string;
};

export type ReportPivot = {
  field: string;
  valueKey: string;
};

export type ReportSort = {
  field: string;
  direction?: "asc" | "desc";
};

export type ReportJoin = {
  source: ReportSource;
  on: { left: string; right: string };
  alias?: string;
  as?: "inner" | "left";
};

export type ReportQuery = {
  source: ReportSource;
  filters?: ReportFilter[];
  groupBy?: ReportGroupBy[];
  aggregates?: ReportAggregate[];
  pivot?: ReportPivot;
  sort?: ReportSort[];
  limit?: number;
  range?: ReportRange;
  join?: ReportJoin[];
  computed?: Array<{ key: string; expression: string; format?: ReportColumnFormat }>;
};

export type ReportQueryResult = {
  columns: ReportColumn[];
  rows: Array<Record<string, unknown>>;
  totalRows: number;
  executedAt: string;
  durationMs: number;
  source: ReportSource;
};

// ---------------------------------------------------------------------------
// Saved reports + widgets
// ---------------------------------------------------------------------------

export type ReportStatus = "draft" | "published" | "archived";

export type WidgetType =
  | "kpi"
  | "table"
  | "pivot"
  | "line_chart"
  | "bar_chart"
  | "pie_chart"
  | "donut_chart"
  | "funnel_chart";

export type WidgetSize = "sm" | "md" | "lg" | "xl";

export type ReportWidget = {
  id: string;
  reportId: string;
  tenantId: string;
  widgetType: WidgetType;
  title: string | null;
  position: number;
  size: WidgetSize;
  kpiKey?: string | null;
  query?: ReportQuery | null;
  config?: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
};

export type ReportWidgetInput = {
  id?: string;
  widgetType: WidgetType;
  title?: string | null;
  position?: number;
  size?: WidgetSize;
  kpiKey?: string | null;
  query?: ReportQuery | null;
  config?: Record<string, unknown> | null;
};

export type SavedReport = {
  id: string;
  tenantId: string;
  name: string;
  slug: string | null;
  description: string | null;
  kind: ExtendedReportKind;
  status: ReportStatus;
  source: ReportSource | "custom";
  query: ReportQuery | null;
  layout: Record<string, unknown> | null;
  parameters: ReportParameter[];
  tags: string[];
  isPinned: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: string | null;
  updatedBy: string | null;
};

export type SavedReportWithWidgets = {
  report: SavedReport;
  widgets: ReportWidget[];
};

export type SavedReportInput = {
  name: string;
  description?: string | null;
  kind?: ExtendedReportKind;
  status?: ReportStatus;
  source?: ReportSource | "custom";
  slug?: string | null;
  query?: ReportQuery | null;
  layout?: Record<string, unknown> | null;
  parameters?: ReportParameter[];
  tags?: string[];
  isPinned?: boolean;
  widgets?: ReportWidgetInput[];
};

// ---------------------------------------------------------------------------
// KPI engine
// ---------------------------------------------------------------------------

export type KpiCategory =
  | "enrollment"
  | "revenue"
  | "attendance"
  | "progress"
  | "assessments"
  | "forms"
  | "messaging"
  | "automation";

export type KpiDirection = "higher_is_better" | "lower_is_better" | "neutral";

export type KpiDefinition = {
  key: string;
  category: KpiCategory;
  label: string;
  description: string;
  format: ReportSummaryFormat;
  direction: KpiDirection;
  source?: ReportSource | "derived";
};

export type KpiValue = {
  key: string;
  category: KpiCategory;
  label: string;
  value: number;
  format: ReportSummaryFormat;
  direction: KpiDirection;
  delta?: number | null;
  deltaPct?: number | null;
  sublabel?: string | null;
  generatedAt: string;
};

export type KpiSnapshot = {
  tenantId: string;
  range: ReportRange;
  values: KpiValue[];
  generatedAt: string;
};

// ---------------------------------------------------------------------------
// Export engine
// ---------------------------------------------------------------------------

export type ExportFormat = "csv" | "xlsx" | "pdf";
export type ExportJobStatus =
  | "pending"
  | "running"
  | "completed"
  | "failed"
  | "expired";

export type ExportJob = {
  id: string;
  tenantId: string;
  reportId: string | null;
  format: ExportFormat;
  status: ExportJobStatus;
  filename: string;
  contentType: string;
  sizeBytes: number;
  params: Record<string, unknown> | null;
  error: string | null;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
  expiresAt: string | null;
  createdBy: string | null;
};

export type ExportJobWithContent = ExportJob & {
  contentBase64: string | null;
};
