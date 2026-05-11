import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = Number(params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ error: "Ugyldig id" }, { status: 400 });
  }

  let body: { oppgave?: string; kategori?: string; status?: string; fase?: string; prosjektplan?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Ugyldig JSON" }, { status: 400 });
  }

  const { oppgave, kategori, status, fase, prosjektplan } = body;

  const setClauses: string[] = [];
  const values: unknown[] = [];
  let idx = 1;

  if (oppgave      !== undefined) { setClauses.push(`oppgave = $${idx++}`);      values.push(oppgave); }
  if (kategori     !== undefined) { setClauses.push(`kategori = $${idx++}`);     values.push(kategori); }
  if (status       !== undefined) { setClauses.push(`status = $${idx++}`);       values.push(status); }
  if (fase         !== undefined) { setClauses.push(`fase = $${idx++}`);         values.push(fase); }
  if (prosjektplan !== undefined) { setClauses.push(`prosjektplan = $${idx++}`); values.push(prosjektplan); }

  if (setClauses.length === 0) {
    return NextResponse.json({ error: "Ingen felter å oppdatere" }, { status: 400 });
  }

  values.push(id);

  const result = await query(
    `UPDATE masterplan SET ${setClauses.join(", ")} WHERE id = $${idx} RETURNING id, fase, oppgave, status, kategori, prioritet, prosjektplan, ai_utkast, pia_kritikk`,
    values
  );

  if (result.rowCount === 0) {
    return NextResponse.json({ error: "Rad ikke funnet" }, { status: 404 });
  }

  return NextResponse.json(result.rows[0]);
}
