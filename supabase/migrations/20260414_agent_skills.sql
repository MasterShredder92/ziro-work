-- Per-agent skill attachments
-- Separate from Star default_skill_ids (global) and template skills (agent_template_skills)
-- Each agent can have its own skill set that Star reads during routing/execution

CREATE TABLE IF NOT EXISTS agent_skills (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id uuid NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  skill_id uuid NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  priority int NOT NULL DEFAULT 10,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(agent_id, skill_id)
);

CREATE INDEX IF NOT EXISTS idx_agent_skills_agent_id ON agent_skills(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_skills_skill_id ON agent_skills(skill_id);

COMMENT ON TABLE agent_skills IS 'Per-agent skill attachments — separate from Star default_skill_ids and template skills';
