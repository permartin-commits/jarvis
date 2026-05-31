-- AI-felter på training_sessions (Supabase / DATABASE_URL).

ALTER TABLE training_sessions
  ADD COLUMN IF NOT EXISTS ai_session_analysis TEXT,
  ADD COLUMN IF NOT EXISTS next_session_suggestion TEXT;
