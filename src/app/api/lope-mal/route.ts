import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const result = await query(
      `SELECT id, distanse_id, distanse_navn, distanse_km, mal_tid_sekunder, notat
       FROM "lope_mal"
       ORDER BY distanse_km ASC`
    );
    return NextResponse.json({ goals: result.rows });
  } catch {
    return NextResponse.json({ goals: [] });
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json() as {
    distanse_id: string;
    distanse_navn: string;
    distanse_km: number;
    mal_tid_sekunder: number | null;
    notat?: string | null;
  };

  try {
    await query(
      `INSERT INTO "lope_mal" (distanse_id, distanse_navn, distanse_km, mal_tid_sekunder, notat)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (distanse_id) DO UPDATE SET
         mal_tid_sekunder = EXCLUDED.mal_tid_sekunder,
         notat            = EXCLUDED.notat,
         updated_at       = now()`,
      [
        body.distanse_id,
        body.distanse_navn,
        body.distanse_km,
        body.mal_tid_sekunder ?? null,
        body.notat ?? null,
      ]
    );
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Ukjent feil";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
