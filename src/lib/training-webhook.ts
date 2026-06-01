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

export function extractTrainingWebhookFields(raw: unknown): {
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

export type TrainingWebhookResult = {
  ok: boolean;
  error: string | null;
  analysis: string | null;
  nextSuggestion: string | null;
};

export async function callTrainingWebhook(
  payload: Record<string, unknown>
): Promise<TrainingWebhookResult> {
  const n8nUrl = process.env.N8N_TRAINING_WEBHOOK_URL;
  const piaSecret = process.env.PIA_WEBHOOK_SECRET;

  if (!n8nUrl) {
    return {
      ok: false,
      error: "N8N_TRAINING_WEBHOOK_URL er ikke konfigurert i miljøvariabler (Vercel).",
      analysis: null,
      nextSuggestion: null,
    };
  }

  if (!piaSecret) {
    return {
      ok: false,
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
        ok: false,
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
      ok: true,
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
    return { ok: false, error: msg, analysis: null, nextSuggestion: null };
  }
}

export function buildTrainingWebhookPayload(
  session: {
    id: number;
    date: string;
    protocol_type: string;
    perceived_effort: number | null;
    notes: string | null;
    is_completed: boolean;
  },
  hangRows: Array<{
    hold_size: string;
    weight_added: number;
    is_failed: boolean;
    set_number: number;
  }>
) {
  const primaryHold = hangRows[0]?.hold_size ?? "";
  const weightKg = hangRows[0]?.weight_added ?? 0;
  const failedCount = hangRows.filter((h) => h.is_failed).length;
  const setsCompleted = new Set(hangRows.map((h) => h.set_number)).size;

  return {
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
    reps_total: hangRows.length,
    reps_failed: failedCount,
    hang_logs: hangRows,
  };
}
