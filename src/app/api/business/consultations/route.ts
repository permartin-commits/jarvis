import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

export interface ConsultationRow {
  id: string;
  created_at: string;
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

export async function GET() {
  try {
    const result = await query<ConsultationRow>(
      `SELECT
         c.id,
         c.created_at,
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
       ORDER BY c.created_at DESC`
    );
    return NextResponse.json({ consultations: result.rows });
  } catch (err) {
    console.error("[business/consultations GET]", err);
    return NextResponse.json({
      consultations: [],
      error: err instanceof Error ? err.message : "Feil",
    });
  }
}
