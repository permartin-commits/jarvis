import { NextRequest, NextResponse } from "next/server";
import { fetchGmailMessageById } from "@/lib/google-api";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const message = await fetchGmailMessageById(params.id);
    return NextResponse.json({ message });
  } catch (err) {
    console.error("[google/gmail GET]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Feil" },
      { status: 500 }
    );
  }
}
