import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

interface QdrantStatusRow {
  id: number;
  status: string | null;
  points_count: string | number | null;
  vectors_count: string | number | null;
  optimizer_status: string | null;
}

export async function GET() {
  try {
    const result = await query<QdrantStatusRow>(
      `SELECT id, status, points_count, vectors_count, optimizer_status
       FROM qdrant_status
       WHERE id = 1
       LIMIT 1`
    );
    const row = result.rows[0];
    return NextResponse.json({ status: row ?? null });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Ukjent feil";
    return NextResponse.json({ status: null, error: message }, { status: 500 });
  }
}
