# Migration Lineage (Normalized)

This lineage is deterministic, conflict-free, and aligned to the Lessonpreneur production target schema.

## Final Ordered Set

1. `20260413_orchestrator_v1.sql`
2. `20260413_orchestrator_v2.sql`
3. `20260413_orchestrator_v3.sql`
4. `20260413_skills_approval.sql`
5. `20260414_agent_skills.sql`
6. `20260414_zirorbs.sql`
7. `20260415_org_board_layout.sql`
8. `20260416_music_school_specialists_seed.sql`
9. `20260417010000_lessonpreneur_core_schema.sql`
10. `20260417_crm_normalization.sql`
11. `20260417_hardening_queue_and_audit.sql`
12. `20260417_zirorbs_is_active.sql`
13. `20260417180000_branding_indexes.sql`
14. `20260417200000_billing_os.sql`
15. `20260418133000_ziro_os_tables.sql`
16. `20260418150000_automation_os_foundation.sql`
17. `20260418150000_billing_os_plans_usage.sql`
18. `20260418173000_scheduling_os_persistence.sql`

## Removed As Dead/Conflicting

- `20260416120000_leads_lifecycle_columns.sql`
- `20260416140000_trials_lifecycle_bundle11.sql`
- `20260416150000_students_enrollment_bundle12.sql`
- `20260416160000_attendance_retention_bundle13.sql`
- `20260416170000_tenant_settings_bundle14.sql`
- `20260417_cleanup_gngbyy.sql`
- `20260417_rebuild_core_schema.sql`
- `20260417_rebuild_missing_core_tables.sql`
- `20260417180000_music_school_core_model.sql`
- `20260417181000_drop_lessonpreneur_tables.sql`
- `20260417120000_branding_indexes.sql`

## Conflict Resolution Notes

- Canonicalized `leads`, `trials`, `attendance`, and `tenant_settings` into `20260417010000_lessonpreneur_core_schema.sql`.
- Removed destructive drop/rebuild migrations that made lineage non-linear.
- Removed duplicate branding index migration and retained the newer canonical index pass.
