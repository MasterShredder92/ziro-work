CREATE TABLE IF NOT EXISTS public.championship_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    report_type TEXT NOT NULL,
    file_url TEXT NOT NULL,
    content JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.championship_reports ENABLE ROW LEVEL SECURITY;

-- Simple policy for now
CREATE POLICY "Enable all for authenticated users" ON public.championship_reports
    FOR ALL USING (true) WITH CHECK (true);
