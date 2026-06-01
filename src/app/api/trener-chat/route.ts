import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const maxDuration = 150;

const TIMEOUT_MS = 120_000;
export async function POST(req: NextRequest) {
  const webhookUrl = process.env.N8N_TRENER_WEBHOOK_URL;
  if (!webhookUrl) {
    return NextResponse.json(
      { error: "N8N_TRENER_WEBHOOK_URL er ikke satt på serveren." },
      { status: 503 }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Ugyldig JSON i request body." }, { status: 400 });
  }

  const { sporsmal, sessionId } = body as { sporsmal?: string; sessionId?: string };
  if (!sporsmal?.trim()) {
    return NextResponse.json({ error: "sporsmal er påkrevd." }, { status: 400 });
  }

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);

  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (process.env.PIA_WEBHOOK_SECRET) {
      headers["x-pia-secret"] = process.env.PIA_WEBHOOK_SECRET;
    }

    const upstream = await fetch(webhookUrl, {
      method: "POST",
      headers,
      body: JSON.stringify({
        sporsmal: sporsmal.trim(),
        sessionID: sessionId ?? `trener_${Date.now()}`,
      }),
      signal: ctrl.signal,
    });

    if (!upstream.ok) {
      return NextResponse.json(
        { error: `Treningsveilederen svarte med status ${upstream.status}` },
        { status: 502 }
      );
    }

    const data = await upstream.json();
    return NextResponse.json(data);
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      return NextResponse.json(
        { error: "Treningsveilederen svarte ikke innen 2 minutter. Prøv igjen." },
        { status: 504 }
      );
    }
    const message = err instanceof Error ? err.message : "Ukjent feil";
    return NextResponse.json({ error: message }, { status: 502 });
  } finally {
    clearTimeout(timer);
  }
}
