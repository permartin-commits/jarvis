-- Klatring: loggbok for ruter (kjør i Supabase SQL Editor eller mot DATABASE_URL).

CREATE TABLE IF NOT EXISTS climbing_routes (
  id SERIAL PRIMARY KEY,
  crag TEXT NOT NULL,
  rutenavn TEXT NOT NULL,
  grad TEXT NOT NULL,
  stjerner SMALLINT NOT NULL DEFAULT 0 CHECK (stjerner >= 0 AND stjerner <= 3),
  dato_send DATE,
  flash BOOLEAN NOT NULL DEFAULT FALSE,
  kommentar TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_climbing_routes_crag ON climbing_routes (crag);
CREATE INDEX IF NOT EXISTS idx_climbing_routes_dato_send ON climbing_routes (dato_send DESC NULLS LAST);
