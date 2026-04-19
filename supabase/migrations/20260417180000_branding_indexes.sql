-- Indexes for multi-tenant branding tables (domain lookup, theme key, recency).
-- Safe to run when tables exist; use IF NOT EXISTS where supported.

DO $$
BEGIN
  IF to_regclass('public.branding_domains') IS NOT NULL THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_branding_domains_tenant_domain ON public.branding_domains (tenant_id, domain_name)';
  END IF;
END
$$;

DO $$
BEGIN
  IF to_regclass('public.branding_domains') IS NOT NULL THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_branding_domains_updated_at ON public.branding_domains (tenant_id, updated_at DESC)';
  END IF;
END
$$;

DO $$
BEGIN
  IF to_regclass('public.branding_themes') IS NOT NULL THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_branding_themes_tenant_theme_key ON public.branding_themes (tenant_id, theme_key)';
  END IF;
END
$$;

DO $$
BEGIN
  IF to_regclass('public.branding_themes') IS NOT NULL THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_branding_themes_updated_at ON public.branding_themes (tenant_id, updated_at DESC)';
  END IF;
END
$$;

DO $$
BEGIN
  IF to_regclass('public.branding_profiles') IS NOT NULL THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_branding_profiles_updated_at ON public.branding_profiles (tenant_id, updated_at DESC)';
  END IF;
END
$$;

DO $$
BEGIN
  IF to_regclass('public.branding_email_identities') IS NOT NULL THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_branding_email_identities_updated_at ON public.branding_email_identities (tenant_id, updated_at DESC)';
  END IF;
END
$$;

DO $$
BEGIN
  IF to_regclass('public.branding_layout_configs') IS NOT NULL THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_branding_layout_configs_updated_at ON public.branding_layout_configs (tenant_id, updated_at DESC)';
  END IF;
END
$$;
