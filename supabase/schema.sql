-- VERTICALS
create table if not exists verticals (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  label text not null,
  subdomain text not null,
  primary_color text not null,
  headline text not null,
  subheadline text not null,
  terminology jsonb default '{}',
  created_at timestamptz default now()
);

-- AGENTS
create table if not exists agents (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  role text not null,
  status text default 'queued',
  system_prompt text,
  color text default '#00ff88',
  position_x float default 0,
  position_y float default 0,
  created_at timestamptz default now()
);

-- AGENT CONVERSATIONS
create table if not exists agent_conversations (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid references agents(id) on delete cascade,
  role text not null,
  content text not null,
  created_at timestamptz default now()
);

-- AGENT TASKS
create table if not exists agent_tasks (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid references agents(id) on delete cascade,
  title text not null,
  description text,
  status text default 'pending',
  result text,
  created_at timestamptz default now(),
  completed_at timestamptz
);

-- CONTACTS
create table if not exists contacts (
  id uuid primary key default gen_random_uuid(),
  business_name text,
  owner_name text,
  email text,
  phone text,
  city text,
  state text,
  country text default 'US',
  vertical text,
  source text,
  email_score integer default 0,
  tags text[] default '{}',
  sequence_step integer default 0,
  last_touched timestamptz,
  status text default 'cold',
  landing_url text,
  notes text,
  created_at timestamptz default now()
);

-- TOUCHES
create table if not exists touches (
  id uuid primary key default gen_random_uuid(),
  contact_id uuid references contacts(id) on delete cascade,
  type text not null,
  metadata jsonb default '{}',
  source text,
  created_at timestamptz default now()
);

-- CUSTOMERS
create table if not exists customers (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  business_name text,
  owner_name text,
  vertical text,
  plan text not null,
  status text default 'trial',
  stripe_customer_id text,
  mrr numeric default 0,
  contact_id uuid references contacts(id),
  trial_started_at timestamptz default now(),
  converted_at timestamptz,
  created_at timestamptz default now()
);

-- SETTINGS
create table if not exists settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz default now()
);

-- INDEXES
create index if not exists idx_agent_conversations_agent_id on agent_conversations(agent_id);
create index if not exists idx_agent_conversations_created_at on agent_conversations(created_at);
create index if not exists idx_agent_tasks_agent_id on agent_tasks(agent_id);
create index if not exists idx_contacts_vertical on contacts(vertical);
create index if not exists idx_contacts_status on contacts(status);
create index if not exists idx_touches_contact_id on touches(contact_id);
create index if not exists idx_customers_contact_id on customers(contact_id);
create index if not exists idx_customers_status on customers(status);
