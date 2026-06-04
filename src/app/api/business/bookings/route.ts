import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

export interface BookingRow {
  id: string;
  created_at: string;
  participant_name: string;
  company: string | null;
  email: string;
  amount_nok: number;
  payment_status: string;
  event_id: string | null;
  event_heading: string | null;
  event_date: string | null;
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const paymentStatus = searchParams.get("payment_status");
  const eventId       = searchParams.get("event_id");

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

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

  try {
    const result = await query<BookingRow>(
      `SELECT
         b.id,
         b.created_at,
         b.participant_name,
         b.company,
         b.email,
         b.amount_nok,
         b.payment_status,
         b.event_id,
         e.heading AS event_heading,
         e.event_date
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
