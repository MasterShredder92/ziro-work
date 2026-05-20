-- Tenant context bridge for Lean Repo / Smart DB architecture.
--
-- Purpose:
--   1. Populate request-local app.tenant_id for every authenticated PostgREST
--      request so native RLS policies using current_setting('app.tenant_id', true)
--      become operational from the application access path.
--   2. Preserve the existing public.current_tenant_id() UUID contract used by
--      policies on UUID tenant_id tables.
--   3. Reject tenant header spoofing for non-platform-admin users.
--
-- Notes:
--   - This hook only applies to Supabase Data API/PostgREST requests.
--   - Service-role callers still bypass RLS by role and must stay restricted to
--     trusted internal jobs, webhooks, migrations, and repair tools.

create or replace function public.current_tenant_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    nullif(current_setting('app.tenant_id', true), '')::uuid,
    (
      select p.tenant_id
      from public.profiles p
      where p.id = auth.uid()
      limit 1
    )
  );
$$;

comment on function public.current_tenant_id()
is 'Canonical tenant resolver. Prefers request-local app.tenant_id, then falls back to the authenticated profile tenant. Returns UUID for existing RLS policies.';

create or replace function public.set_app_tenant_context()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_claims jsonb := coalesce(nullif(current_setting('request.jwt.claims', true), '')::jsonb, '{}'::jsonb);
  v_headers jsonb := coalesce(nullif(current_setting('request.headers', true), '')::jsonb, '{}'::jsonb);
  v_user_id_text text := nullif(v_claims->>'sub', '');
  v_user_id uuid;
  v_requested_tenant_text text := nullif(v_headers->>'x-tenant-id', '');
  v_requested_tenant uuid;
  v_profile_tenant uuid;
  v_is_platform_admin boolean := false;
begin
  -- Keep unauthenticated and service-role-without-sub requests untouched.
  -- Leaving app.tenant_id unset means current_setting(..., true) returns NULL,
  -- which avoids invalid UUID casts in existing policies.
  if v_user_id_text is null then
    return;
  end if;

  if v_user_id_text !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$' then
    raise insufficient_privilege using message = 'Invalid authenticated user context';
  end if;

  v_user_id := v_user_id_text::uuid;

  if v_requested_tenant_text is not null then
    if v_requested_tenant_text !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$' then
      raise insufficient_privilege using message = 'Invalid tenant context';
    end if;
    v_requested_tenant := v_requested_tenant_text::uuid;
  end if;

  select p.tenant_id,
         coalesce(p.is_platform_admin, false)
    into v_profile_tenant, v_is_platform_admin
  from public.profiles p
  where p.id = v_user_id
  limit 1;

  if v_profile_tenant is null then
    return;
  end if;

  -- Regular users cannot switch tenants by spoofing x-tenant-id.
  if v_requested_tenant is not null and v_requested_tenant <> v_profile_tenant then
    if not v_is_platform_admin then
      raise insufficient_privilege using message = 'Invalid tenant context';
    end if;

    -- tenants.id is text in the live schema, but stores the tenant identifier.
    if not exists (
      select 1
      from public.tenants t
      where t.id = v_requested_tenant::text
    ) then
      raise insufficient_privilege using message = 'Unknown tenant context';
    end if;

    perform set_config('app.tenant_id', v_requested_tenant::text, true);
    return;
  end if;

  perform set_config('app.tenant_id', v_profile_tenant::text, true);
end;
$$;

comment on function public.set_app_tenant_context()
is 'PostgREST pre-request hook. Initializes app.tenant_id from authenticated profile tenant with validated platform-admin tenant override.';

grant execute on function public.current_tenant_id() to anon, authenticated, service_role;
grant execute on function public.set_app_tenant_context() to anon, authenticated, service_role;

alter role authenticator
  set pgrst.db_pre_request = 'public.set_app_tenant_context';

notify pgrst, 'reload config';
