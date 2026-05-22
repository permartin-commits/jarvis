import { readFileSync } from "fs";
import pg from "pg";

const env = readFileSync(".env.local", "utf8");
const url = env.match(/^DATABASE_URL=(.+)$/m)[1].trim().replace(/^["']|["']$/g, "");

const pool = new pg.Pool({
  connectionString: url,
  ssl: { rejectUnauthorized: false },
});

try {
  const r = await pool.query("SELECT id, email FROM auth.users LIMIT 3");
  console.log(JSON.stringify(r.rows, null, 2));
} catch (e) {
  console.error("auth.users:", e.message);
}

await pool.end();
