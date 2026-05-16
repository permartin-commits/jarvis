import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const result = await query(
      `SELECT *
       FROM system_logs
       ORDER BY created_at DESC
       LIMIT 50`
    );
    return NextResponse.json({ logs: result.rows });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Ukjent feil";
    return NextResponse.json({ logs: [], error: message });
  }
}
