import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import pg from "pg";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

function loadDatabaseUrl() {
  const envPath = path.join(root, ".env.local");
  const raw = fs.readFileSync(envPath, "utf8");
  const line = raw.split(/\r?\n/).find((l) => l.startsWith("DATABASE_URL="));
  if (!line) throw new Error("DATABASE_URL missing in .env.local");
  let url = line.slice("DATABASE_URL=".length).trim();
  if (
    (url.startsWith('"') && url.endsWith('"')) ||
    (url.startsWith("'") && url.endsWith("'"))
  ) {
    url = url.slice(1, -1);
  }
  return url;
}

const sql = fs.readFileSync(
  path.join(__dirname, "training-sessions-rep-number.sql"),
  "utf8"
);

const client = new pg.Client({
  connectionString: loadDatabaseUrl(),
  ssl: { rejectUnauthorized: false },
});

await client.connect();
await client.query(sql);
const { rows } = await client.query(
  `SELECT column_name FROM information_schema.columns
   WHERE table_schema = 'public' AND table_name = 'hang_logs'
   ORDER BY ordinal_position`
);
console.log("hang_logs:", rows.map((r) => r.column_name).join(", "));
await client.end();
console.log("Migration OK");
