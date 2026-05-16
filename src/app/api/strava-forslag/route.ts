import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const result = await query(
      `SELECT forslag_til_neste_aktivitet
       FROM "Strava"
       WHERE forslag_til_neste_aktivitet IS NOT NULL
         AND forslag_til_neste_aktivitet <> ''
       ORDER BY dato DESC
       LIMIT 1`
    );
    return NextResponse.json({
      forslag: result.rows[0]?.forslag_til_neste_aktivitet ?? null,
    });
  } catch {
    return NextResponse.json({ forslag: null });
  }
}
