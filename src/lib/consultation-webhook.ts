export type ConsultationWebhookAction =
  | "confirm"
  | "confirm_reschedule"
  | "cancelled";

export type ConsultationWebhookPayload = {
  action: ConsultationWebhookAction;
  consultation_id: string;
  name: string;
  email: string;
  company: string | null;
  message: string | null;
  requested_date: string;
  requested_time: string;
  original_date: string;
  original_time: string;
  event_id: string | null;
  event_heading: string | null;
  rescheduled: boolean;
};

export type ConsultationWebhookResult = {
  ok: boolean;
  error: string | null;
};

export async function callConsultationWebhook(
  payload: ConsultationWebhookPayload
): Promise<ConsultationWebhookResult> {
  const webhookUrl =
    process.env.N8N_CONSULTATION_CONFIRMATION_URL ??
    "https://n8n.verlanse.no/webhook/bekreftelse-konsultasjon";
  const secret = process.env.N8N_CONSULTATION_SECRET;

  if (!secret) {
    return {
      ok: false,
      error: "N8N_CONSULTATION_SECRET er ikke konfigurert (kreves for x-api-key).",
    };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 60_000);

  try {
    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": secret,
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      return {
        ok: false,
        error: `n8n svarte med ${res.status}${text ? `: ${text.slice(0, 200)}` : ""}`,
      };
    }

    return { ok: true, error: null };
  } catch (err) {
    const message =
      err instanceof Error && err.name === "AbortError"
        ? "Webhook tidsavbrudd (60s)."
        : err instanceof Error
          ? err.message
          : "Kunne ikke nå n8n-webhook.";
    return { ok: false, error: message };
  } finally {
    clearTimeout(timeout);
  }
}
