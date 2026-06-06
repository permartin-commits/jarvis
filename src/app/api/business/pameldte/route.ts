import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

export interface PameldteRow {
  id: string;
  created_at: string;
  navn: string;
  epost: string;
  bedrift: string | null;
  event_id: string;
  event_heading: string | null;
  status_betaling: string;
  belop: number;
}

export async function GET(req: NextRequest) {
  const eventId = req.nextUrl.searchParams.get("event_id");

  const conditions: string[] = [];
  const params: unknown[] = [];

  if (eventId) {
    params.push(eventId);
    conditions.push(`event_id = $${params.length}`);
  }

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

  try {
    const result = await query<PameldteRow>(
      `SELECT
         id,
         created_at,
         navn,
         epost,
         bedrift,
         event_id,
         event_heading,
         status_betaling,
         belop
       FROM v_pameldte
       ${where}
       ORDER BY created_at DESC`,
      params.length ? params : undefined
    );
    return NextResponse.json({ pameldte: result.rows });
  } catch (err) {
    console.error("[business/pameldte GET]", err);
    return NextResponse.json({
      pameldte: [],
      error: err instanceof Error ? err.message : "Feil",
    });
  }
}
