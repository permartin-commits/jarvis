import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  console.log("🔥 [API PROXY] Ruten ble truffet!");

  try {
    // 1. Forsøker å hente og parse payload fra frontend
    const body = await req.json();
    console.log("📦 [API PROXY] Mottok data:", JSON.stringify(body).substring(0, 100) + "...");

    // 2. Henter miljøvariabler
    const n8nUrl = process.env.N8N_PROSJEKT_WEBHOOK_URL;
    const piaSecret = process.env.PIA_WEBHOOK_SECRET;

    console.log("🔑 [API PROXY] Sjekker miljøvariabler:");
    console.log(" - N8N_URL:", n8nUrl ? `✅ Finnes (${n8nUrl})` : "❌ MANGLER!");
    console.log(" - SECRET:", piaSecret ? "✅ Finnes" : "❌ MANGLER!");

    // 3. Sikkerhetssjekk
    if (!n8nUrl || !piaSecret) {
      console.error("❌ [API PROXY] Avbryter: Mangler miljøvariabler.");
      return NextResponse.json(
        { error: "Serverkonfigurasjon mangler" },
        { status: 500 }
      );
    }

    // 4. Sender forespørselen videre til Master OS (n8n)
    console.log("🚀 [API PROXY] Sender request til n8n...");
    
    const response = await fetch(n8nUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-pia-secret': piaSecret,
      },
      body: JSON.stringify(body),
    });

    // 5. Håndterer feil fra n8n (f.eks. 401 Unauthorized eller 404)
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ [API PROXY] Feil fra n8n: ${response.status} ${response.statusText}`, errorText);
      return NextResponse.json(
        { error: `Feil fra Master OS: ${response.status}` },
        { status: response.status }
      );
    }

    // 6. Henter svaret og returnerer til klienten
    const data = await response.json();
    console.log("✅ [API PROXY] Suksess! Fikk svar fra n8n.");
    
    return NextResponse.json(data);

  } catch (error) {
    // Fanger opp nettverksfeil, JSON-parsing-feil etc.
    console.error("💥 [API PROXY] Kritisk feil i proxy:", error);
    return NextResponse.json(
      { error: "Kunne ikke utføre API-kallet mot Master OS" },
      { status: 500 }
    );
  }
}