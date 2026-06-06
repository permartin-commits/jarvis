import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import {
  callConsultationWebhook,
  type ConsultationWebhookPayload,
} from "@/lib/consultation-webhook";

export const dynamic = "force-dynamic";

type Action = "confirm" | "reject" | "confirm_reschedule";

interface ConsultationDbRow {
  id: string;
  name: string;
  email: string;
  company: string | null;
  requested_date: string;
  requested_time: string;
  message: string | null;
  status: string;
  event_id: string | null;
  event_heading: string | null;
}

function buildWebhookPayload(
  consultation: ConsultationDbRow,
  action: ConsultationWebhookPayload["action"],
  requested_date: string,
  requested_time: string
): ConsultationWebhookPayload {
  const originalDate = consultation.requested_date.slice(0, 10);
  const originalTime = consultation.requested_time.slice(0, 5);

  return {
    action,
    consultation_id: consultation.id,
    name: consultation.name,
    email: consultation.email,
    company: consultation.company,
    message: consultation.message,
    requested_date,
    requested_time,
    original_date: originalDate,
    original_time: originalTime,
    event_id: consultation.event_id,
    event_heading: consultation.event_heading,
    rescheduled: action === "confirm_reschedule",
  };
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Ugyldig JSON" }, { status: 400 });
  }

  const { action, requested_date, requested_time } = body as {
    action?: Action;
    requested_date?: string;
    requested_time?: string;
  };

  if (!action || !["confirm", "reject", "confirm_reschedule"].includes(action)) {
    return NextResponse.json({ error: "Ugyldig handling" }, { status: 400 });
  }

  if (action === "confirm_reschedule" && (!requested_date || !requested_time)) {
    return NextResponse.json(
      { error: "Ny dato og tid kreves for ombokking" },
      { status: 400 }
    );
  }

  let consultation: ConsultationDbRow;
  try {
    const result = await query<ConsultationDbRow>(
      `SELECT
         c.id,
         c.name,
         c.email,
         c.company,
         c.requested_date::text AS requested_date,
         c.requested_time::text AS requested_time,
         c.message,
         c.status,
         c.event_id,
         e.heading AS event_heading
       FROM consultations c
       LEFT JOIN events e ON e.id = c.event_id
       WHERE c.id = $1`,
      [id]
    );
    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Konsultasjon ikke funnet" }, { status: 404 });
    }
    consultation = result.rows[0];
  } catch (err) {
    console.error("[consultations/action] db fetch", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Databasefeil" },
      { status: 500 }
    );
  }

  const originalDate = consultation.requested_date.slice(0, 10);
  const originalTime = consultation.requested_time.slice(0, 5);

  let webhookAction: ConsultationWebhookPayload["action"];
  let finalDate: string;
  let finalTime: string;
  let nextStatus: string;

  if (action === "reject") {
    webhookAction = "cancelled";
    finalDate = originalDate;
    finalTime = originalTime;
    nextStatus = "cancelled";
  } else if (action === "confirm_reschedule") {
    webhookAction = "confirm_reschedule";
    finalDate = requested_date!;
    finalTime = requested_time!;
    nextStatus = "confirmed";
  } else {
    webhookAction = "confirm";
    finalDate = originalDate;
    finalTime = originalTime;
    nextStatus = "confirmed";
  }

  const webhook = await callConsultationWebhook(
    buildWebhookPayload(consultation, webhookAction, finalDate, finalTime)
  );

  if (!webhook.ok) {
    return NextResponse.json(
      { ok: false, webhook_ok: false, webhook_error: webhook.error },
      { status: 502 }
    );
  }

  try {
    await query(
      `UPDATE consultations
       SET status = $2,
           requested_date = $3::date,
           requested_time = $4::time
       WHERE id = $1`,
      [id, nextStatus, finalDate, finalTime]
    );
  } catch (err) {
    console.error("[consultations/action] db update", err);
    return NextResponse.json(
      {
        ok: false,
        webhook_ok: true,
        error: "Webhook OK, men kunne ikke oppdatere databasen",
      },
      { status: 500 }
    );
  }

  return NextResponse.json({
    ok: true,
    webhook_ok: true,
    id,
    action: webhookAction,
    status: nextStatus,
    requested_date: finalDate,
    requested_time: finalTime,
    rescheduled: webhookAction === "confirm_reschedule",
  });
}
