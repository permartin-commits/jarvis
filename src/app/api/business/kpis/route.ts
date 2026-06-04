import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

async function scalar(sql: string): Promise<number> {
  try {
    const result = await query<{ v: string }>(sql);
    return Number(result.rows[0]?.v ?? 0);
  } catch (err) {
    console.error("[business/kpis partial]", err);
    return 0;
  }
}

export async function GET() {
  const [
    newLeads7d,
    openLeads,
    upcomingEvents,
    paidBookings,
    revenuePaid,
    pendingCount,
    revenuePending,
  ] = await Promise.all([
    scalar(`SELECT COUNT(*)::text AS v FROM leads
            WHERE created_at >= NOW() - INTERVAL '7 days'
              AND LOWER(status) IN ('new', 'ny')`),
    scalar(`SELECT COUNT(*)::text AS v FROM leads
            WHERE LOWER(status) IN ('new', 'ny', 'contacted', 'kontaktet', 'qualified', 'kvalifisert')`),
    scalar(`SELECT COUNT(*)::text AS v FROM events
            WHERE event_date >= CURRENT_DATE AND is_published = true`),
    scalar(`SELECT COUNT(*)::text AS v FROM bookings WHERE payment_status = 'paid'`),
    scalar(`SELECT COALESCE(SUM(amount_nok), 0)::text AS v FROM bookings
            WHERE payment_status = 'paid'`),
    scalar(`SELECT COUNT(*)::text AS v FROM bookings WHERE payment_status = 'pending'`),
    scalar(`SELECT COALESCE(SUM(amount_nok), 0)::text AS v FROM bookings
            WHERE payment_status = 'pending'`),
  ]);

  return NextResponse.json({
    newLeads7d,
    openLeads,
    upcomingEvents,
    paidBookings,
    revenuePaid,
    pendingCount,
    revenuePending,
  });
}
