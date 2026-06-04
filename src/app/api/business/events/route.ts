import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

export interface EventRow {
  id: string;
  heading: string;
  event_date: string;
  start_time: string | null;
  end_time: string | null;
  location: string | null;
  price: number | null;
  capacity: number | null;
  seats_taken: number | null;
  is_published: boolean;
  category: string | null;
  paid_count: number;
  pending_count: number;
  revenue: number;
}

const EVENTS_WITH_BOOKINGS = `
  SELECT
    e.id,
    e.heading,
    e.event_date,
    e.start_time,
    e.end_time,
    e.location,
    e.price_nok AS price,
    e.capacity,
    e.seats_taken,
    e.is_published,
    e.category,
    COUNT(b.id) FILTER (WHERE b.payment_status = 'paid')::int    AS paid_count,
    COUNT(b.id) FILTER (WHERE b.payment_status = 'pending')::int AS pending_count,
    COALESCE(SUM(b.amount_nok) FILTER (WHERE b.payment_status = 'paid'), 0) AS revenue
  FROM events e
  LEFT JOIN bookings b ON b.event_id = e.id
  WHERE e.event_date >= CURRENT_DATE - INTERVAL '30 days'
     OR e.is_published = true
  GROUP BY e.id
  ORDER BY e.event_date DESC
`;

const EVENTS_ONLY = `
  SELECT
    e.id,
    e.heading,
    e.event_date,
    e.start_time,
    e.end_time,
    e.location,
    e.price_nok AS price,
    e.capacity,
    e.seats_taken,
    e.is_published,
    e.category,
    0 AS paid_count,
    0 AS pending_count,
    0 AS revenue
  FROM events e
  WHERE e.event_date >= CURRENT_DATE - INTERVAL '30 days'
     OR e.is_published = true
  ORDER BY e.event_date DESC
`;

export async function GET() {
  try {
    let result;
    try {
      result = await query<EventRow>(EVENTS_WITH_BOOKINGS);
    } catch {
      result = await query<EventRow>(EVENTS_ONLY);
    }
    return NextResponse.json({ events: result.rows });
  } catch (err) {
    console.error("[business/events GET]", err);
    return NextResponse.json({ events: [], error: err instanceof Error ? err.message : "Feil" });
  }
}
