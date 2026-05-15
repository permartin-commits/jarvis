import { NextResponse, NextRequest } from "next/server";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const result = await query(
      `SELECT id, dato, starttid, varighet_sekunder, cm_grip,
              med_vekt, ekstravekt_kg, kommentar
       FROM "Beastmaker"
       ORDER BY starttid DESC
       LIMIT 500`
    );
    return NextResponse.json({ sessions: result.rows });
  } catch {
    return NextResponse.json({ sessions: [] });
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json() as {
    starttid: string;
    varighet_sekunder: number;
    cm_grip: number;
    med_vekt: boolean;
    ekstravekt_kg: number | null;
    kommentar: string | null;
  };

  const result = await query(
    `INSERT INTO "Beastmaker"
       (starttid, varighet_sekunder, cm_grip, med_vekt, ekstravekt_kg, kommentar)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id, dato, starttid, varighet_sekunder, cm_grip, med_vekt, ekstravekt_kg, kommentar`,
    [
      body.starttid,
      body.varighet_sekunder,
      body.cm_grip,
      body.med_vekt,
      body.ekstravekt_kg ?? null,
      body.kommentar ?? null,
    ]
  );

  return NextResponse.json({ session: result.rows[0] }, { status: 201 });
}
