-- ZiroWork Raven: Communication Queue Infrastructure

-- 1. communication_queue table
-- Stores all communication requests from agents before they're batched and sent
create table if not exists public.communication_queue (
  id uuid primary key default gen_random_uuid(),
  tenant_id text not null,
  request_from_agent text not null, -- "sid", "ruby", "star", "stewie", "vader", "bub"
  recipient_type text not null, -- "parent", "family", "student", "teacher"
  recipient_id uuid, -- family_id, student_id, teacher_id, etc.
  recipient_email text,
  recipient_phone text,
  message_type text not null, -- "text", "email", "in_app"
  priority text not null default 'routine', -- "urgent", "routine", "digest"
  subject text, -- for emails
  body text not null,
  context jsonb not null default '{}', -- event data, student name, etc.
  status text not null default 'queued', -- "queued", "batched", "sent", "failed"
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.communication_queue enable row level security;
create policy "tenant_isolation" on public.communication_queue for all using (tenant_id = current_setting('app.tenant_id', true));

-- 2. message_library table
-- Stores the 100K curated messages for Raven to search and match
create table if not exists public.message_library (
  id uuid primary key default gen_random_uuid(),
  tenant_id text not null,
  category text not null, -- "welcome", "payment_reminder", "lesson_moved", "progress_update", "concern_follow_up", etc.
  situation text not null, -- "first_lesson_scheduled", "payment_overdue", "attendance_concern", etc.
  tone text not null, -- "friendly", "professional", "urgent", "celebratory"
  message_text text not null,
  tags jsonb not null default '[]'::jsonb, -- ["parent", "student", "urgent"], etc.
  usage_count integer not null default 0,
  effectiveness_score float, -- 0-1, based on outcomes
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.message_library enable row level security;
create policy "tenant_isolation" on public.message_library for all using (tenant_id = current_setting('app.tenant_id', true));

-- 3. communication_log table
-- Audit trail of all messages sent (for learning and compliance)
create table if not exists public.communication_log (
  id uuid primary key default gen_random_uuid(),
  tenant_id text not null,
  queue_id uuid references public.communication_queue(id) on delete set null,
  recipient_type text not null,
  recipient_id uuid,
  recipient_email text,
  recipient_phone text,
  message_type text not null,
  subject text,
  body text not null,
  agents_involved jsonb not null default '[]'::jsonb, -- ["sid", "ruby"] if batched
  sent_at timestamptz not null default now(),
  delivery_status text, -- "delivered", "failed", "bounced"
  created_at timestamptz not null default now()
);

alter table public.communication_log enable row level security;
create policy "tenant_isolation" on public.communication_log for all using (tenant_id = current_setting('app.tenant_id', true));

-- 4. Create indexes for performance
create index if not exists idx_communication_queue_tenant_status on public.communication_queue(tenant_id, status);
create index if not exists idx_communication_queue_recipient on public.communication_queue(recipient_id, recipient_type);
create index if not exists idx_message_library_tenant_category on public.message_library(tenant_id, category);
create index if not exists idx_communication_log_tenant_sent on public.communication_log(tenant_id, sent_at);
