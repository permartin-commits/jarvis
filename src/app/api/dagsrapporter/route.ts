import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import type { Dagsrapport } from "@/lib/dagsrapporter";

export const dynamic = "force-dynamic";

interface DagsrapportRow {
  id: string;
  dato: string;
  type: string;
  rapport: string | null;
  handling: string | null;
}

export async function GET() {
  try {
    const result = await query<DagsrapportRow>(
      `SELECT id, dato::text, type, rapport, handling
       FROM dagsrapporter
       ORDER BY dato DESC, created_at DESC
       LIMIT 200`
    );

    const rapporter: Dagsrapport[] = result.rows.map((row) => ({
      id: row.id,
      dato: row.dato,
      type: row.type,
      rapport: row.rapport,
      handling: row.handling,
    }));

    return NextResponse.json({ rapporter });
  } catch (err) {
    console.error("[dagsrapporter]", err);
    return NextResponse.json({ rapporter: [], error: "Kunne ikke hente rapporter" });
  }
}
