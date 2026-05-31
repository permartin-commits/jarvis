import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

function parseId(params: { id: string }): number | null {
  const id = parseInt(params.id, 10);
  return Number.isFinite(id) && id > 0 ? id : null;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = parseId(params);
  if (id == null) {
    return NextResponse.json({ error: "Ugyldig id" }, { status: 400 });
  }

  try {
    const sessionRes = await query(
      `SELECT id, date, protocol_type, perceived_effort, notes, is_completed,
              ai_session_analysis, next_session_suggestion, created_at
       FROM training_sessions
       WHERE id = $1`,
      [id]
    );
    if (sessionRes.rows.length === 0) {
      return NextResponse.json({ error: "Økt ikke funnet" }, { status: 404 });
    }

    const logsRes = await query(
      `SELECT id, session_id, set_number, rep_number, hold_size, weight_added,
              target_time_seconds, actual_time_seconds, is_failed, created_at
       FROM hang_logs
       WHERE session_id = $1
       ORDER BY set_number ASC, rep_number ASC`,
      [id]
    );

    return NextResponse.json({
      session: sessionRes.rows[0],
      hang_logs: logsRes.rows,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Kunne ikke hente økt.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
