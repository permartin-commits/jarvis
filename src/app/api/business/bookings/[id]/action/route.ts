import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import {
  callConsultationWebhook,
  type ConsultationWebhookPayload,
} from "@/lib/consultation-webhook";

export const dynamic = "force-dynamic";

type Action = "confirm" | "reject" | "confirm_reschedule";

interface BookingDbRow {
  id: string;
  name: string;
  email: string;
  company: string | null;
  requested_date: string | null;
  requested_time: string | null;
  message: string | null;
  status: string;
  event_id: string | null;
  event_heading: string | null;
}

function buildWebhookPayload(
  booking: BookingDbRow,
  action: ConsultationWebhookPayload["action"],
  requested_date: string,
  requested_time: string
): ConsultationWebhookPayload {
  const originalDate = booking.requested_date?.slice(0, 10) ?? requested_date;
  const originalTime = booking.requested_time?.slice(0, 5) ?? requested_time;

  return {
    action,
    consultation_id: booking.id,
    name: booking.name,
    email: booking.email,
    company: booking.company,
    message: booking.message,
    requested_date,
    requested_time,
    original_date: originalDate,
    original_time: originalTime,
    event_id: booking.event_id,
    event_heading: booking.event_heading,
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

  let booking: BookingDbRow;
  try {
    const result = await query<BookingDbRow>(
      `SELECT
         b.id,
         b.name,
         b.email,
         b.company,
         b.requested_date::text AS requested_date,
         b.requested_time::text AS requested_time,
         b.message,
         b.status,
         b.event_id,
         COALESCE(b.event_heading, e.heading) AS event_heading
       FROM bookings b
       LEFT JOIN events e ON e.id = b.event_id
       WHERE b.id = $1`,
      [id]
    );
    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Booking ikke funnet" }, { status: 404 });
    }
    booking = result.rows[0];
  } catch (err) {
    console.error("[bookings/action] db fetch", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Databasefeil" },
      { status: 500 }
    );
  }

  const originalDate = booking.requested_date?.slice(0, 10) ?? "";
  const originalTime = booking.requested_time?.slice(0, 5) ?? "";

  let webhookAction: ConsultationWebhookPayload["action"];
  let finalDate: string;
  let finalTime: string;
  let nextStatus: string;

  if (action === "reject") {
    webhookAction = "cancelled";
    finalDate = originalDate || requested_date || new Date().toISOString().slice(0, 10);
    finalTime = originalTime || requested_time || "09:00";
    nextStatus = "cancelled";
  } else if (action === "confirm_reschedule") {
    webhookAction = "confirm_reschedule";
    finalDate = requested_date!;
    finalTime = requested_time!;
    nextStatus = "confirmed";
  } else {
    webhookAction = "confirm";
    finalDate = originalDate || requested_date || new Date().toISOString().slice(0, 10);
    finalTime = originalTime || requested_time || "09:00";
    nextStatus = "confirmed";
  }

  const webhook = await callConsultationWebhook(
    buildWebhookPayload(booking, webhookAction, finalDate, finalTime)
  );

  if (!webhook.ok) {
    return NextResponse.json(
      { ok: false, webhook_ok: false, webhook_error: webhook.error },
      { status: 502 }
    );
  }

  try {
    await query(
      `UPDATE bookings
       SET status = $2,
           requested_date = $3::date,
           requested_time = $4::time,
           updated_at = now()
       WHERE id = $1`,
      [id, nextStatus, finalDate, finalTime]
    );
  } catch (err) {
    console.error("[bookings/action] db update", err);
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
