export type TenantPipelines = {
  lead?: boolean;
  trial?: boolean;
  enrollment?: boolean;
  retention?: boolean;
};

export type TenantEventsConfig = {
  disabled?: string[];
};

export type MergedTenantSettings = {
  tenant_id?: string;
  lead_pipeline: {
    dead_after_days: number;
    stale_after_days: number;
    fresh_max_days: number;
  };
  trial_pipeline: {
    dead_after_days: number;
    fresh_max_days: number;
  };
  retention_pipeline: {
    warning_threshold: number;
    risk_threshold: number;
  };
  kpi_settings: {
    lead_weight: number;
    trial_weight: number;
    student_weight: number;
  };
  schedule: {
    dashboard_tick_ms: number;
  };
  pipelines: Required<TenantPipelines>;
  events: TenantEventsConfig;
  enrollment_pipeline: Record<string, unknown>;
};
