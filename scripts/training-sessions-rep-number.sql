-- Repeaters: én rad per rep i hang_logs (kjør mot DATABASE_URL).

ALTER TABLE hang_logs
  ADD COLUMN IF NOT EXISTS rep_number INTEGER NOT NULL DEFAULT 1;

ALTER TABLE hang_logs
  DROP CONSTRAINT IF EXISTS hang_logs_session_id_set_number_key;

CREATE UNIQUE INDEX IF NOT EXISTS hang_logs_session_set_rep_unique
  ON hang_logs (session_id, set_number, rep_number);
