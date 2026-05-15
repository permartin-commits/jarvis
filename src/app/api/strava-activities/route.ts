import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const result = await query(
      `SELECT id, strava_id, dato, navn, type,
              distanse_km, varighet_sekunder,
              gjennomsnittsfart_kmt, hoydemeter,
              gjennomsnittspuls, maxpuls, kalorier, raw,
              analyse_av_okt, progresjonsanalyse
       FROM "Strava"
       ORDER BY dato DESC
       LIMIT 100`
    );
    return NextResponse.json({ activities: result.rows });
  } catch {
    return NextResponse.json({ activities: [] });
  }
}
