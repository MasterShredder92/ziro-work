-- Optional Postgres indexes for multi-tenant branding tables.
-- Apply when tables exist in Supabase: branding_profiles, branding_themes,
-- branding_domains, branding_email_identities, branding_layout_configs.

CREATE INDEX IF NOT EXISTS idx_branding_domains_domain_name
  ON branding_domains (domain_name);

CREATE INDEX IF NOT EXISTS idx_branding_domains_tenant_updated
  ON branding_domains (tenant_id, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_branding_themes_theme_key
  ON branding_themes (tenant_id, theme_key);

CREATE INDEX IF NOT EXISTS idx_branding_themes_updated
  ON branding_themes (tenant_id, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_branding_profiles_updated
  ON branding_profiles (tenant_id, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_branding_email_updated
  ON branding_email_identities (tenant_id, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_branding_layout_updated
  ON branding_layout_configs (tenant_id, updated_at DESC);
