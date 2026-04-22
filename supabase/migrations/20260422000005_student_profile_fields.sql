-- Step 1: Add missing student profile fields
-- bio, learning_style, experience already exist — only adding photo_url and experience_level

ALTER TABLE students
  ADD COLUMN IF NOT EXISTS photo_url TEXT,
  ADD COLUMN IF NOT EXISTS experience_level TEXT CHECK (experience_level IN ('beginner', 'intermediate', 'advanced', 'performance'));

-- Grant access
GRANT SELECT, UPDATE (photo_url, experience_level) ON students TO authenticated;
GRANT SELECT, UPDATE (photo_url, experience_level) ON students TO service_role;

-- Verify
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'students'
  AND column_name IN ('photo_url', 'experience_level', 'bio', 'learning_style', 'experience')
ORDER BY column_name;
