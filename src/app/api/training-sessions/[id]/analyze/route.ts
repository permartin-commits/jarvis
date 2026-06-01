import { NextRequest, NextResponse } from "next/server";
import { getDb, query } from "@/lib/db";
import {
  buildTrainingWebhookPayload,
  callTrainingWebhook,
} from "@/lib/training-webhook";

export const dynamic = "force-dynamic";

function parseId(params: { id: string }): number | null {
  const id = parseInt(params.id, 10);
  return Number.isFinite(id) && id > 0 ? id : null;
}

export async function POST(
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

    const session = sessionRes.rows[0] as {
      id: number;
      date: string;
      protocol_type: string;
      perceived_effort: number | null;
      notes: string | null;
      is_completed: boolean;
    };
    const hangRows = logsRes.rows as Array<{
      hold_size: string;
      weight_added: number;
      is_failed: boolean;
      set_number: number;
    }>;
    if (hangRows.length === 0) {
      return NextResponse.json(
        { error: "Økten har ingen heng-logg." },
        { status: 400 }
      );
    }

    const webhook = await callTrainingWebhook(
      buildTrainingWebhookPayload(session, hangRows)
    );

    if (!webhook.ok) {
      return NextResponse.json(
        {
          webhook_ok: false,
          webhook_error: webhook.error,
          session,
        },
        { status: 502 }
      );
    }

    const client = await getDb().connect();
    try {
      const updated = await client.query(
        `UPDATE training_sessions
         SET ai_session_analysis = COALESCE($1, ai_session_analysis),
             next_session_suggestion = COALESCE($2, next_session_suggestion)
         WHERE id = $3
         RETURNING id, date, protocol_type, perceived_effort, notes, is_completed,
                   ai_session_analysis, next_session_suggestion, created_at`,
        [webhook.analysis, webhook.nextSuggestion, id]
      );

      return NextResponse.json({
        session: updated.rows[0],
        hang_logs: hangRows,
        webhook_ok: true,
        webhook_error: null,
        analysis: webhook.analysis,
        next_session_suggestion: webhook.nextSuggestion,
      });
    } finally {
      client.release();
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Analyse feilet.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
