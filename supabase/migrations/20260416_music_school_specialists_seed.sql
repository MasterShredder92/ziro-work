-- Ensure Music School specialist roster exists and is visible + assigned to the Music School Zirorb.
-- Idempotent: INSERT new rows by slug; ON CONFLICT repairs visibility, archive state, and zirorb_id.

insert into agents (
  name,
  slug,
  role,
  purpose,
  mode,
  owner_type,
  color,
  usage_triggers,
  auto_use_by_star,
  business_context,
  status,
  is_archived,
  is_visible_in_ui,
  zirorb_id,
  zirorb_sort,
  created_by
)
select
  v.name,
  v.slug,
  v.role,
  v.purpose,
  'ephemeral',
  'user',
  v.color,
  '[]'::jsonb,
  true,
  'music_school',
  'active',
  false,
  true,
  ms.id,
  v.sort_ord,
  'migration'
from (
  values
    ('Closer', 'closer', 'Sales closer', 'Trial-to-enrollment conversion and objection handling.', '#c084fc', 0),
    (
      'Enrollment Coordinator',
      'enrollment-coordinator',
      'Enrollment ops',
      'Lead intake, onboarding, forms, and family setup.',
      '#a855f7',
      1
    ),
    (
      'Scheduling / Placement',
      'scheduling-placement',
      'Scheduling',
      'Lesson placement, calendars, rooms, and availability.',
      '#9333ea',
      2
    ),
    ('Retention', 'retention', 'Retention', 'Churn prevention, engagement, and save offers.', '#7e22ce', 3),
    ('Reactivation', 'reactivation', 'Reactivation', 'Win-back campaigns and dormant student outreach.', '#6d28d9', 4),
    (
      'Billing / Recovery',
      'billing-recovery',
      'Billing',
      'Tuition, failed payments, dunning, and account recovery.',
      '#5b21b6',
      5
    ),
    (
      'Parent Communication',
      'parent-communication',
      'Family comms',
      'Parent messaging, announcements, and day-to-day coordination.',
      '#4c1d95',
      6
    )
) as v(name, slug, role, purpose, color, sort_ord)
cross join lateral (select id from zirorbs where slug = 'music-school' limit 1) ms
where ms.id is not null
on conflict (slug) do update
set
  name = excluded.name,
  role = excluded.role,
  purpose = excluded.purpose,
  color = excluded.color,
  zirorb_id = excluded.zirorb_id,
  zirorb_sort = excluded.zirorb_sort,
  is_archived = false,
  is_visible_in_ui = true,
  business_context = 'music_school',
  status = case
    when agents.status = 'retired' then agents.status
    else 'active'
  end,
  updated_at = now();
