import { NextRequest, NextResponse } from "next/server";
import type { PoolClient } from "pg";
import { getDb, query } from "@/lib/db";
import type { HangLogDraft, SaveTrainingSessionBody } from "@/lib/training";

export const dynamic = "force-dynamic";

function parseBody(body: unknown): SaveTrainingSessionBody | null {
  if (!body || typeof body !== "object") return null;
  const b = body as Record<string, unknown>;
  const protocol_type =
    typeof b.protocol_type === "string" ? b.protocol_type.trim() : "";
  if (!protocol_type) return null;

  const is_completed = Boolean(b.is_completed);
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
  };
}

function pickStringField(
  o: Record<string, unknown>,
  keys: string[]
): string | null {
  for (const key of keys) {
    const v = o[key];
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return null;
}

function extractTrainingWebhookFields(raw: unknown): {
  analysis: string | null;
  nextSuggestion: string | null;
} {
  if (raw == null) return { analysis: null, nextSuggestion: null };
  if (typeof raw === "string") {
    const t = raw.trim();
    return { analysis: t || null, nextSuggestion: null };
  }
  if (typeof raw === "object") {
    const o = raw as Record<string, unknown>;
    const analysis =
      pickStringField(o, [
        "ai_session_analysis",
        "analysis",
        "message",
        "output",
        "text",
        "reply",
        "response",
      ]) ?? null;
    const nextSuggestion =
      pickStringField(o, [
        "next_session_suggestion",
        "nextSessionSuggestion",
        "suggestion",
        "next_session",
      ]) ?? null;
    if (analysis || nextSuggestion) {
      return { analysis, nextSuggestion };
    }
    if (Array.isArray(o) && o[0] && typeof o[0] === "object") {
      const first = o[0] as Record<string, unknown>;
      if (typeof first.json === "object" && first.json) {
        return extractTrainingWebhookFields(first.json);
      }
    }
    const fallback = JSON.stringify(raw, null, 2).trim();
    return { analysis: fallback || null, nextSuggestion: null };
  }
  return { analysis: null, nextSuggestion: null };
}

async function callTrainingWebhook(payload: Record<string, unknown>) {
  const n8nUrl = process.env.N8N_TRAINING_WEBHOOK_URL;
  const piaSecret = process.env.PIA_WEBHOOK_SECRET;

  if (!n8nUrl) {
    return {
      ok: false as const,
      error: "N8N_TRAINING_WEBHOOK_URL er ikke konfigurert.",
      analysis: null,
      nextSuggestion: null,
    };
  }

  if (!piaSecret) {
    return {
      ok: false as const,
      error: "PIA_WEBHOOK_SECRET er ikke konfigurert (kreves for x-pia-secret).",
      analysis: null,
      nextSuggestion: null,
    };
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "x-pia-secret": piaSecret,
  };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 60_000);

  try {
    const res = await fetch(n8nUrl, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    const text = await res.text();
    let parsed: unknown = text;
    try {
      parsed = JSON.parse(text);
    } catch {
      /* plain text */
    }

    if (!res.ok) {
      const detail =
        typeof parsed === "object" && parsed && "message" in parsed
          ? String((parsed as { message?: string }).message)
          : text.trim().slice(0, 200);
      return {
        ok: false as const,
        error: detail
          ? `n8n svarte med ${res.status}: ${detail}`
          : `n8n svarte med ${res.status}`,
        analysis: null,
        nextSuggestion: null,
      };
    }

    const fields = extractTrainingWebhookFields(parsed);
    let analysis =
      fields.analysis ||
      (text.trim() && !text.trim().startsWith("{") ? text.trim() : null);
    if (analysis === "Workflow was started") analysis = null;

    return {
      ok: true as const,
      error: null,
      analysis,
      nextSuggestion: fields.nextSuggestion,
    };
  } catch (e) {
    clearTimeout(timeout);
    const msg =
      e instanceof Error && e.name === "AbortError"
        ? "Tidsavbrudd mot n8n (60s)."
        : "Kunne ikke nå n8n-webhook.";
    return { ok: false as const, error: msg, analysis: null, nextSuggestion: null };
  }
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

    const sessionRes = await client.query<{
      id: number;
      date: string;
      protocol_type: string;
      perceived_effort: number | null;
      notes: string | null;
      is_completed: boolean;
      created_at: string;
    }>(
      `INSERT INTO training_sessions (date, protocol_type, perceived_effort, notes, is_completed)
       VALUES (CURRENT_DATE, $1, $2, $3, $4)
       RETURNING id, date, protocol_type, perceived_effort, notes, is_completed, created_at`,
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

    const primaryHold = parsed.hang_logs[0]?.hold_size ?? "";
    const weightKg = parsed.hang_logs[0]?.weight_added ?? 0;
    const failedCount = parsed.hang_logs.filter((h) => h.is_failed).length;
    const setsCompleted = new Set(parsed.hang_logs.map((h) => h.set_number)).size;

    const webhookPayload = {
      session_id: session.id,
      date: session.date,
      protocol_type: session.protocol_type,
      hold_size: primaryHold,
      weight_added_kg: weightKg,
      perceived_effort: session.perceived_effort,
      notes: session.notes,
      is_completed: session.is_completed,
      sets_total: setsCompleted,
      sets_failed: failedCount,
      reps_total: parsed.hang_logs.length,
      reps_failed: failedCount,
      hang_logs: hangRows,
    };

    const webhook = await callTrainingWebhook(webhookPayload);

    let sessionOut = session;
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

    return NextResponse.json(
      {
        session: sessionOut,
        hang_logs: hangRows,
        webhook_ok: webhook.ok,
        webhook_error: webhook.error,
        analysis: webhook.analysis,
        next_session_suggestion: webhook.nextSuggestion,
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
