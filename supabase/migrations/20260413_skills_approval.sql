-- Skills approval workflow columns
-- Supports draft → pending_approval → approved/rejected lifecycle

ALTER TABLE skills ADD COLUMN IF NOT EXISTS approval_status text NOT NULL DEFAULT 'approved';
ALTER TABLE skills ADD COLUMN IF NOT EXISTS proposed_by text DEFAULT NULL;
ALTER TABLE skills ADD COLUMN IF NOT EXISTS approved_by text DEFAULT NULL;
ALTER TABLE skills ADD COLUMN IF NOT EXISTS approved_at timestamptz DEFAULT NULL;

COMMENT ON COLUMN skills.approval_status IS 'draft | pending_approval | approved | rejected';
COMMENT ON COLUMN skills.proposed_by IS 'Who proposed: admin, star, system';
COMMENT ON COLUMN skills.approved_by IS 'Who approved: admin username or null';

-- Backfill existing active skills as admin-approved
UPDATE skills SET approval_status = 'approved', proposed_by = 'admin'
WHERE approval_status = 'approved' AND proposed_by IS NULL;
