import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { parseRoutePayload } from "@/lib/climbing";

export const dynamic = "force-dynamic";

const ROUTE_COLUMNS = `id, crag, rutenavn, grad, stjerner, dato_send, flash, kommentar, created_at`;

function parseId(params: { id: string }): number | null {
  const id = parseInt(params.id, 10);
  return Number.isFinite(id) && id > 0 ? id : null;
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = parseId(params);
  if (id == null) {
    return NextResponse.json({ error: "Ugyldig id" }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Ugyldig JSON" }, { status: 400 });
  }

  const parsed = parseRoutePayload(body);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const { data } = parsed;
  const flash = data.dato_send ? data.flash : false;

  try {
    const result = await query(
      `UPDATE climbing_routes
       SET crag = $1, rutenavn = $2, grad = $3, stjerner = $4,
           dato_send = $5, flash = $6, kommentar = $7
       WHERE id = $8
       RETURNING ${ROUTE_COLUMNS}`,
      [
        data.crag,
        data.rutenavn,
        data.grad,
        data.stjerner,
        data.dato_send,
        flash,
        data.kommentar,
        id,
      ]
    );

    if (result.rowCount === 0) {
      return NextResponse.json({ error: "Rute ikke funnet" }, { status: 404 });
    }

    return NextResponse.json({ route: result.rows[0] });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Kunne ikke oppdatere rute.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = parseId(params);
  if (id == null) {
    return NextResponse.json({ error: "Ugyldig id" }, { status: 400 });
  }

  try {
    const result = await query(`DELETE FROM climbing_routes WHERE id = $1`, [
      id,
    ]);
    if (result.rowCount === 0) {
      return NextResponse.json({ error: "Rute ikke funnet" }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Kunne ikke slette rute.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
