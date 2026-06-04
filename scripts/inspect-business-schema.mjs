import dotenv from "dotenv";
import pg from "pg";

dotenv.config({ path: ".env.local" });

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: false,
});

async function main() {
  const tables = ["leads", "events", "bookings"];
  for (const table of tables) {
    const cols = await pool.query(
      `SELECT column_name, data_type
       FROM information_schema.columns
       WHERE table_schema = 'public' AND table_name = $1
       ORDER BY ordinal_position`,
      [table]
    );
    console.log(`\n=== ${table.toUpperCase()} (${cols.rows.length} cols) ===`);
    console.log(cols.rows.map((r) => `${r.column_name}:${r.data_type}`).join("\n"));

    try {
      const count = await pool.query(`SELECT COUNT(*)::int AS c FROM ${table}`);
      console.log(`count: ${count.rows[0].c}`);
      const sample = await pool.query(`SELECT * FROM ${table} LIMIT 1`);
      if (sample.rows[0]) console.log("sample:", JSON.stringify(sample.rows[0], null, 2));
    } catch (e) {
      console.log("query error:", e.message);
    }
  }
}

main()
  .catch((e) => console.error(e))
  .finally(() => pool.end());
