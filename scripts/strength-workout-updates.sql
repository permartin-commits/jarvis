-- Kjør i Supabase SQL Editor (eller mot samme PostgreSQL som DATABASE_URL).
-- Utvider styrketrening med notater, planlagte økter og «Fast økt»-maler.

-- 1) Notater på loggede økter
ALTER TABLE workouts
  ADD COLUMN IF NOT EXISTS notes TEXT;

-- completed_at kan være NULL for planlagte økter (ingen fullførte sett ennå)
ALTER TABLE workouts
  ALTER COLUMN completed_at DROP NOT NULL;

-- 2) Maler for «Fast økt»
CREATE TABLE IF NOT EXISTS workout_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, name)
);

CREATE TABLE IF NOT EXISTS workout_template_exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES workout_templates(id) ON DELETE CASCADE,
  exercise_id UUID NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
  sort_order INT NOT NULL DEFAULT 0,
  default_set_count INT NOT NULL DEFAULT 3,
  UNIQUE (template_id, sort_order)
);

CREATE INDEX IF NOT EXISTS idx_workout_templates_user
  ON workout_templates (user_id);

CREATE INDEX IF NOT EXISTS idx_workout_template_exercises_template
  ON workout_template_exercises (template_id);
