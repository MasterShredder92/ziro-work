-- Remote migration alignment marker.
--
-- The tenant context pre-request hook was applied once during production repair
-- and then immediately superseded by 20260520020432_tenant_context_pre_request.sql.
-- Keep this no-op migration so the repository migration history matches the live
-- Supabase migration ledger without replaying obsolete function definitions.

select 1;
