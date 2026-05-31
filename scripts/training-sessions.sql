-- Beastmaker / klatring: strukturerte treningsøkter (Supabase SQL Editor eller DATABASE_URL).

CREATE TABLE IF NOT EXISTS training_sessions (
  id SERIAL PRIMARY KEY,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  protocol_type TEXT NOT NULL,
  perceived_effort SMALLINT CHECK (perceived_effort IS NULL OR (perceived_effort >= 1 AND perceived_effort <= 10)),
  notes TEXT,
  is_completed BOOLEAN NOT NULL DEFAULT FALSE,
  ai_session_analysis TEXT,
  next_session_suggestion TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS hang_logs (
  id SERIAL PRIMARY KEY,
  session_id INTEGER NOT NULL REFERENCES training_sessions(id) ON DELETE CASCADE,
  set_number INTEGER NOT NULL CHECK (set_number >= 1),
  rep_number INTEGER NOT NULL DEFAULT 1 CHECK (rep_number >= 1),
  hold_size TEXT NOT NULL,
  weight_added DOUBLE PRECISION NOT NULL DEFAULT 0,
  target_time_seconds INTEGER NOT NULL,
  actual_time_seconds INTEGER NOT NULL,
  is_failed BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (session_id, set_number, rep_number)
);

CREATE INDEX IF NOT EXISTS idx_training_sessions_date ON training_sessions (date DESC);
CREATE INDEX IF NOT EXISTS idx_hang_logs_session ON hang_logs (session_id);
