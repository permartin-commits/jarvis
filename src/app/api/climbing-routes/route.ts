import { NextResponse, NextRequest } from "next/server";
import { query } from "@/lib/db";
import { parseRoutePayload } from "@/lib/climbing";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [routesRes, cragsRes] = await Promise.all([
      query(
        `SELECT id, crag, rutenavn, grad, stjerner, dato_send, flash, kommentar, created_at
         FROM climbing_routes
         ORDER BY COALESCE(dato_send, '9999-12-31'::date) DESC, created_at DESC
         LIMIT 1000`
      ),
      query(
        `SELECT DISTINCT crag FROM climbing_routes ORDER BY crag ASC`
      ),
    ]);
    const crags = cragsRes.rows.map((r) => (r as { crag: string }).crag);
    return NextResponse.json({ routes: routesRes.rows, crags });
  } catch {
    return NextResponse.json({ routes: [], crags: [] });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = parseRoutePayload(body);
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const { data } = parsed;
    const flash = data.dato_send ? data.flash : false;

    const result = await query(
      `INSERT INTO climbing_routes
         (crag, rutenavn, grad, stjerner, dato_send, flash, kommentar)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, crag, rutenavn, grad, stjerner, dato_send, flash, kommentar, created_at`,
      [
        data.crag,
        data.rutenavn,
        data.grad,
        data.stjerner,
        data.dato_send,
        flash,
        data.kommentar,
      ]
    );

    return NextResponse.json({ route: result.rows[0] }, { status: 201 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Kunne ikke lagre rute.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
