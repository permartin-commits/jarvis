import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function POST(req: NextRequest) {
  let body: {
    fase?: string;
    oppgave?: string;
    kategori?: string;
    prosjektplan?: string;
    status?: string;
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Ugyldig JSON" }, { status: 400 });
  }

  const { fase, oppgave, kategori, prosjektplan, status } = body;

  if (!oppgave?.trim()) {
    return NextResponse.json({ error: "Heading (oppgave) er påkrevd" }, { status: 400 });
  }

  const result = await query(
    `INSERT INTO masterplan (fase, oppgave, kategori, prosjektplan, status)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, fase, oppgave, status, kategori, prioritet, prosjektplan, ai_utkast, pia_kritikk`,
    [fase ?? null, oppgave.trim(), kategori ?? null, prosjektplan ?? null, status ?? "Planlagt"]
  );

  return NextResponse.json(result.rows[0], { status: 201 });
}
