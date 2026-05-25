import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

export interface PiaStartupLogRow {
  id: number;
  session_id: string | null;
  execution_id: string | null;
  tidspunkt: string;
  masterplan_id: number | null;
}

function parseMasterplanId(sessionId: string | null): number | null {
  if (!sessionId) return null;
  const m = sessionId.match(/startup[_:\-]?(\d+)/i);
  return m ? Number(m[1]) : null;
}

export async function GET(req: NextRequest) {
  const since = req.nextUrl.searchParams.get("since");

  try {
    const result = await query<{
      id: string;
      session_id: string | null;
      execution_id: string | null;
      tidspunkt: string;
    }>(
      since
        ? `SELECT id, session_id, execution_id, tidspunkt
           FROM pia_usage_log
           WHERE session_id ILIKE '%startup%'
             AND tidspunkt >= $1::timestamptz
           ORDER BY tidspunkt ASC
           LIMIT 50`
        : `SELECT id, session_id, execution_id, tidspunkt
           FROM pia_usage_log
           WHERE session_id ILIKE '%startup%'
           ORDER BY tidspunkt DESC
           LIMIT 30`,
      since ? [since] : undefined
    );

    const rows: PiaStartupLogRow[] = result.rows.map((r) => ({
      id: Number(r.id),
      session_id: r.session_id,
      execution_id: r.execution_id,
      tidspunkt: r.tidspunkt,
      masterplan_id: parseMasterplanId(r.session_id),
    }));

    return NextResponse.json({ rows });
  } catch (err) {
    console.error("[pia-startup-log]", err);
    return NextResponse.json({ rows: [], error: "Kunne ikke hente logger" });
  }
}
