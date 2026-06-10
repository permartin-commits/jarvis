import { NextRequest, NextResponse } from "next/server";
import { fetchCalendarEventById } from "@/lib/google-api";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const event = await fetchCalendarEventById(params.id);
    return NextResponse.json({ event });
  } catch (err) {
    console.error("[google/calendar GET]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Feil" },
      { status: 500 }
    );
  }
}
