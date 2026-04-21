-- 🛡️ ZiroWork: Championship Infrastructure Migration
-- Purpose: Lock in the "Memory" and "Tools" for the Senior Operator Ecosystem.

-- 1. ZIRO: The Feedback Loop (Audit)
CREATE TABLE IF NOT EXISTS public.agent_audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id text NOT NULL,
  agent_id text NOT NULL, -- The worker agent (e.g., Stewie)
  director_id text DEFAULT 'ziro',
  content_audited text NOT NULL,
  status text NOT NULL, -- 'approved', 'rejected'
  feedback text, -- Ziro's reason for rejection
  created_at timestamptz DEFAULT now()
);

-- 2. BUB: Financial Architect & Square/Stripe Mirror
CREATE TABLE IF NOT EXISTS public.payment_processor_raw_data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id text NOT NULL,
  processor text NOT NULL, -- 'square', 'stripe'
  raw_payload jsonb NOT NULL,
  processed_at timestamptz DEFAULT now(),
  status text DEFAULT 'pending' -- Bub's analysis status
);

-- 3. VADER: Teacher Compliance & Pedagogy
CREATE TABLE IF NOT EXISTS public.teacher_compliance_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id text NOT NULL,
  teacher_id uuid REFERENCES public.teachers(id) ON DELETE CASCADE,
  audit_date date NOT NULL,
  notes_status text NOT NULL, -- 'missing', 'weak', 'championship'
  check_in_status text NOT NULL, -- 'compliant', 'late', 'missing'
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.teacher_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id text NOT NULL,
  teacher_id uuid REFERENCES public.teachers(id) ON DELETE CASCADE,
  doc_type text NOT NULL, -- 'w9', 'contract', 'background_check'
  status text NOT NULL, -- 'pending', 'signed', 'expired'
  file_url text,
  signed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- 4. STEWIE: Retention & Health Scores
CREATE TABLE IF NOT EXISTS public.student_health_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id text NOT NULL,
  student_id uuid REFERENCES public.students(id) ON DELETE CASCADE,
  score integer NOT NULL DEFAULT 100, -- 0-100
  factors jsonb DEFAULT '[]', -- ['late_payment', 'missed_lesson']
  risk_level text NOT NULL DEFAULT 'low',
  last_updated timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.championship_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id text NOT NULL,
  student_id uuid REFERENCES public.students(id) ON DELETE CASCADE,
  report_type text NOT NULL, -- 'weekly', 'monthly'
  content jsonb NOT NULL, -- The data points for the report
  file_url text, -- If a PDF is generated
  delivered_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- 5. RLS & Tenant Isolation
ALTER TABLE public.agent_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_processor_raw_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_compliance_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_health_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.championship_reports ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE
  tbl text;
BEGIN
  FOR tbl IN
    SELECT unnest(ARRAY[
      'agent_audit_logs',
      'payment_processor_raw_data',
      'teacher_compliance_logs',
      'teacher_documents',
      'student_health_scores',
      'championship_reports'
    ])
  LOOP
    EXECUTE format(
      'CREATE POLICY tenant_isolation ON public.%I FOR ALL USING (tenant_id = current_setting(''app.tenant_id'', true))',
      tbl
    );
  END LOOP;
END $$;
