import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

export interface BookingRow {
  id: string;
  created_at: string;
  name: string;
  company: string | null;
  email: string;
  phone: string | null;
  amount_nok: number;
  payment_status: string;
  event_id: string | null;
  event_heading: string | null;
  event_type: string | null;
  message: string | null;
  requested_date: string | null;
  requested_time: string | null;
  status: string;
  notes: string | null;
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const paymentStatus = searchParams.get("payment_status");
  const eventId       = searchParams.get("event_id");
  const bookingStatus = searchParams.get("status");

  const conditions: string[] = [];
  const params: unknown[]    = [];

  if (paymentStatus && paymentStatus !== "alle") {
    params.push(paymentStatus);
    conditions.push(`b.payment_status = $${params.length}`);
  }
  if (eventId && eventId !== "alle") {
    params.push(eventId);
    conditions.push(`b.event_id = $${params.length}`);
  }
  if (bookingStatus && bookingStatus !== "alle") {
    params.push(bookingStatus);
    conditions.push(`b.status = $${params.length}`);
  }

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

  try {
    const result = await query<BookingRow>(
      `SELECT
         b.id,
         b.created_at,
         b.name,
         b.company,
         b.email,
         b.phone,
         b.amount_nok,
         b.payment_status,
         b.event_id,
         COALESCE(b.event_heading, e.heading) AS event_heading,
         b.event_type,
         b.message,
         b.requested_date::text AS requested_date,
         b.requested_time::text AS requested_time,
         b.status,
         b.notes
       FROM bookings b
       LEFT JOIN events e ON e.id = b.event_id
       ${where}
       ORDER BY b.created_at DESC`,
      params.length ? params : undefined
    );
    return NextResponse.json({ bookings: result.rows });
  } catch (err) {
    console.error("[business/bookings GET]", err);
    return NextResponse.json({ bookings: [], error: err instanceof Error ? err.message : "Feil" });
  }
}
