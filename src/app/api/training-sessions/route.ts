import { NextRequest, NextResponse } from "next/server";
import type { PoolClient } from "pg";
import { getDb, query } from "@/lib/db";
import type { HangLogDraft, SaveTrainingSessionBody } from "@/lib/training";
import {
  buildTrainingWebhookPayload,
  callTrainingWebhook,
} from "@/lib/training-webhook";

export const dynamic = "force-dynamic";

function parseBody(body: unknown): (SaveTrainingSessionBody & {
  run_webhook: boolean;
}) | null {
  if (!body || typeof body !== "object") return null;
  const b = body as Record<string, unknown>;
  const protocol_type =
    typeof b.protocol_type === "string" ? b.protocol_type.trim() : "";
  if (!protocol_type) return null;

  const is_completed = Boolean(b.is_completed);
  const run_webhook = Boolean(b.run_webhook);
  const hang_logs = Array.isArray(b.hang_logs) ? b.hang_logs : [];
  if (hang_logs.length === 0) return null;

  const parsedLogs: HangLogDraft[] = [];
  for (const row of hang_logs) {
    if (!row || typeof row !== "object") return null;
    const r = row as Record<string, unknown>;
    const set_number = Number(r.set_number);
    const rep_number =
      r.rep_number != null ? Number(r.rep_number) : 1;
    const hold_size = typeof r.hold_size === "string" ? r.hold_size.trim() : "";
    const weight_added = Number(r.weight_added);
    const target_time_seconds = Number(r.target_time_seconds);
    const actual_time_seconds = Number(r.actual_time_seconds);
    const is_failed = Boolean(r.is_failed);

    if (
      !Number.isInteger(set_number) ||
      set_number < 1 ||
      !Number.isInteger(rep_number) ||
      rep_number < 1 ||
      !hold_size ||
      !Number.isFinite(weight_added) ||
      weight_added < 0 ||
      !Number.isInteger(target_time_seconds) ||
      target_time_seconds < 1 ||
      !Number.isInteger(actual_time_seconds) ||
      actual_time_seconds < 0
    ) {
      return null;
    }

    parsedLogs.push({
      set_number,
      rep_number,
      hold_size,
      weight_added,
      target_time_seconds,
      actual_time_seconds,
      is_failed,
    });
  }

  let perceived_effort: number | null = null;
  if (b.perceived_effort != null && b.perceived_effort !== "") {
    const pe = Number(b.perceived_effort);
    if (!Number.isInteger(pe) || pe < 1 || pe > 10) return null;
    perceived_effort = pe;
  }

  const notes =
    typeof b.notes === "string" && b.notes.trim() ? b.notes.trim() : null;

  return {
    protocol_type,
    perceived_effort,
    notes,
    is_completed,
    hang_logs: parsedLogs,
    run_webhook,
  };
}

export async function GET() {
  try {
    const result = await query(
      `SELECT id, date, protocol_type, perceived_effort, notes, is_completed,
              ai_session_analysis, next_session_suggestion, created_at
       FROM training_sessions
       ORDER BY created_at DESC
       LIMIT 50`
    );
    return NextResponse.json({ sessions: result.rows });
  } catch {
    return NextResponse.json({ sessions: [] });
  }
}

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Ugyldig JSON" }, { status: 400 });
  }

  const parsed = parseBody(body);
  if (!parsed) {
    return NextResponse.json(
      { error: "Ugyldig øktdata — protokoll og minst ett sett kreves." },
      { status: 400 }
    );
  }

  const client = await getDb().connect();

  try {
    await client.query("BEGIN");

    const sessionRes = await client.query(
      `INSERT INTO training_sessions (date, protocol_type, perceived_effort, notes, is_completed)
       VALUES (CURRENT_DATE, $1, $2, $3, $4)
       RETURNING id, date, protocol_type, perceived_effort, notes, is_completed,
                 ai_session_analysis, next_session_suggestion, created_at`,
      [
        parsed.protocol_type,
        parsed.perceived_effort,
        parsed.notes,
        parsed.is_completed,
      ]
    );

    const session = sessionRes.rows[0];
    const hangRows = await insertHangLogs(client, session.id, parsed.hang_logs);

    await client.query("COMMIT");

    let sessionOut = session;
    let webhook_ok: boolean | null = null;
    let webhook_error: string | null = null;
    let analysis: string | null = null;
    let next_session_suggestion: string | null = null;

    if (parsed.run_webhook) {
      const webhook = await callTrainingWebhook(
        buildTrainingWebhookPayload(session, hangRows)
      );
      webhook_ok = webhook.ok;
      webhook_error = webhook.error;
      analysis = webhook.analysis;
      next_session_suggestion = webhook.nextSuggestion;

      if (webhook.ok && (webhook.analysis || webhook.nextSuggestion)) {
        const updated = await client.query(
          `UPDATE training_sessions
           SET ai_session_analysis = COALESCE($1, ai_session_analysis),
               next_session_suggestion = COALESCE($2, next_session_suggestion)
           WHERE id = $3
           RETURNING id, date, protocol_type, perceived_effort, notes, is_completed,
                     ai_session_analysis, next_session_suggestion, created_at`,
          [webhook.analysis, webhook.nextSuggestion, session.id]
        );
        sessionOut = updated.rows[0];
      }
    }

    return NextResponse.json(
      {
        session: sessionOut,
        hang_logs: hangRows,
        webhook_ok,
        webhook_error,
        analysis,
        next_session_suggestion,
        webhook_skipped: !parsed.run_webhook,
      },
      { status: 201 }
    );
  } catch (e) {
    await client.query("ROLLBACK");
    const msg = e instanceof Error ? e.message : "Kunne ikke lagre økt.";
    return NextResponse.json({ error: msg }, { status: 500 });
  } finally {
    client.release();
  }
}

async function insertHangLogs(
  client: PoolClient,
  sessionId: number,
  logs: HangLogDraft[]
) {
  const inserted = [];
  for (const log of logs) {
    const res = await client.query(
      `INSERT INTO hang_logs
         (session_id, set_number, rep_number, hold_size, weight_added, target_time_seconds, actual_time_seconds, is_failed)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id, session_id, set_number, rep_number, hold_size, weight_added, target_time_seconds, actual_time_seconds, is_failed, created_at`,
      [
        sessionId,
        log.set_number,
        log.rep_number,
        log.hold_size,
        log.weight_added,
        log.target_time_seconds,
        log.actual_time_seconds,
        log.is_failed,
      ]
    );
    inserted.push(res.rows[0]);
  }
  return inserted;
}
