import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const result = await query(
      `SELECT temperature, uptime, memory_total_mb, memory_used_mb, containers, created_at
       FROM server_status
       ORDER BY created_at DESC
       LIMIT 1`
    );
    if (result.rows.length === 0) {
      return NextResponse.json({ status: null });
    }
    return NextResponse.json({ status: result.rows[0] });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Ukjent feil";
    return NextResponse.json({ status: null, error: message }, { status: 500 });
  }
}
