# PIA Master OS — Arkitektur & Sårbarhetsanalyse

_Basert på gjennomgang av kodebasen (Next.js / n8n / Supabase / Qdrant) · Mai 2026_

---

## Oppsummering

| Alvorlighet | Antall funn |
|-------------|-------------|
| Kritisk     | 2           |
| Høy         | 4           |
| Middels     | 5           |
| Lav         | 1           |

> **Høyest prioritet: proxy webhook-kallet (S1 + S2)**
>
> Webhook-URL og manglende autentisering er de enkleste og mest kritiske sårbarhetene å utbedre.
> To linjer kode i en ny API-route (`/api/pia-chat`) løser begge: URL-en forsvinner fra
> klient-bundelen og du kan legge til HMAC-sjekk på server-siden. Dette bør gjøres før neste
> public-facing deploy.

---

## Arkitektur — Dataflyt og tillitsgrenser

### Tillitsgrenser (Trust Boundaries)

| Status             | Grense                                              |
|--------------------|-----------------------------------------------------|
| **Ukontrollert**   | Internett → n8n webhook (ingen auth)                |
| **Delvis kontrollert** | Vercel → Supabase (SSL, men ingen rotasjon)     |
| **Delvis kontrollert** | Cloudflare Tunnel → n8n admin (Zero Trust)      |
| **Kontrollert**    | Vercel env → API-nøkler (ikke i klient-bundle)      |

### Enkeltpunkter for feil (SPOF)

| Alvorlighet | Beskrivelse |
|-------------|-------------|
| **Kritisk** | Dell micro-server (n8n + Docker) — strøm/hardware-feil stopper all AI-behandling |
| **Middels** | Supabase Free Tier — connection-grense på 15 kan nås ved serverless scaling |
| **Lav**     | Qdrant (lokal?) — dersom RAG-database er på samme server som n8n |

---

## Funn

### Sikkerhet

#### S1 — Webhook-URL eksponert i klient-bundle · `Kritisk`

**Detaljer:**
`WEBHOOK_URL` er hardkodet i `PiaCoreSection.tsx` (`"use client"`). URL-en er synlig i nettleserens network-tab og i JavaScript-bundlen — alle kan kalle n8n-endepunktet direkte fra utsiden.

**Anbefalt tiltak:**
Proxy kallet gjennom en Next.js API-route (`/api/pia-chat`). Klienten kaller kun din egen backend; n8n-URL-en lagres som en server-side env-variabel (`NEVER_PUBLIC_N8N_URL`).

---

#### S2 — Ingen autentisering på n8n webhook · `Kritisk`

**Detaljer:**
Endepunktet `/webhook/pia-svar` aksepterer POST fra hvem som helst uten signatur eller nøkkel. En angriper kan sende vilkårlige spørsmål og generere Gemini API-kostnader eller manipulere agentkjøringer.

**Anbefalt tiltak:**
Legg til en delt hemmelighet: sett en HTTP-header (`X-PIA-Secret: <token>`) i proxy-ruten og valider den i n8n med en IF-node. Token lagres i Vercel env og n8n credentials.

---

#### S3 — Ingen rate limiting på chat-endepunktet · `Høy`

**Detaljer:**
Ingen begrensning på antall meldinger per bruker/IP. Et enkelt script kan sende tusenvis av forespørsler og generere betydelige Gemini-kostnader eller fylle Supabase-loggtabeller.

**Anbefalt tiltak:**
Aktiver Vercel's innebygde Edge Rate Limiting (`vercel.json`) på `/api/pia-chat`, eller bruk Cloudflare Rate Limiting foran domenet. Sett maks 20 req/min per IP.

---

#### S4 — Ingen CSRF-beskyttelse på API-routes · `Høy`

**Detaljer:**
Routes som `/api/beastmaker` (POST) og `/api/portefolje` sjekker ikke `Origin`- eller `Referer`-header. En ondsinnet nettside kan lure nettleseren til å sende cross-origin forespørsler som endrer data.

**Anbefalt tiltak:**
Valider at `Origin`-headeren matcher ditt domene (`pia.verlanse.no`) i alle muterende API-routes. Next.js App Router gir ikke dette automatisk.

---

#### S5 — n8n admin-panel eksponert via Cloudflare Tunnel · `Middels`

**Detaljer:**
`n8n.verlanse.no` er tilgjengelig over internett. Dersom Cloudflare Zero Trust ikke er korrekt konfigurert med e-post/SSO-policy, kan admin-panelet nås av uvedkommende.

**Anbefalt tiltak:**
Bekreft at Zero Trust Application-policy krever autentisert bruker (e-post: din@adresse). Aktiver 2FA i n8n og sett IP Allow List til kun norske IP-er om mulig.

---

#### S6 — DATABASE_URL i Vercel — ingen rotasjonsstrategi · `Middels`

**Detaljer:**
Supabase-tilkoblingsstrengen med passord er permanent i Vercel env. Dersom den lekker (f.eks. i build-logs) finnes ingen automatisk rotasjon eller nøkkelversjonering.

**Anbefalt tiltak:**
Bruk Supabase Session Pooler (port 6543) med PgBouncer-modus. Aktiver database-passord-rotasjon i Supabase-dashboardet, og bruk Vercel Secret Store for sensitiv verdi.

---

### Feilhåndtering

#### E1 — Ingen timeout på webhook-kall · `Høy`

**Detaljer:**
`fetch()` til n8n-webhooken har ingen `AbortController` eller timeout. Dersom Gemini API er treg eller n8n henger, viser UI-en "PIA tenker…" på ubestemt tid uten mulighet for avbrudd.

**Anbefalt tiltak:**
Legg til `AbortController` med 30s timeout i proxy-ruten: `const ctrl = new AbortController(); setTimeout(() => ctrl.abort(), 30000)`. Returner en klar feilmelding ved timeout.

---

#### E2 — n8n er single point of failure · `Høy`

**Detaljer:**
Hele PIA-chat-funksjonaliteten avhenger av én selvhostet n8n-instans på en Dell micro-server. Strømbrudd, Docker-kræsj eller nettverksavbrudd gjør chat helt utilgjengelig uten varsling.

**Anbefalt tiltak:**
Implementer health-check i proxy-ruten mot n8n. Vis en tydelig degraded-banner i UI. Vurder n8n Cloud som failover for kritiske workflows, eller sett opp Portainer health-alert via e-post.

---

#### E3 — Stille feil i Supabase-queries · `Middels`

**Detaljer:**
Nesten alle API-routes fanger exceptions og returnerer tomme arrays uten logging. Dersom Supabase er utilgjengelig, vises bare blanke tabeller — ingen alert til deg som eier.

**Anbefalt tiltak:**
Legg til strukturert server-side logging (Vercel Logs eller Sentry) på `.catch()`-blokker. Skil mellom "tom tabell" og "DB-feil" i API-responsen (f.eks. `{ error: true, reason: '...' }`).

---

#### E4 — Ingen retry-logikk ved transiente feil · `Middels`

**Detaljer:**
Supabase pg-pool har ingen automatisk retry ved kortvarige tilkoblingsfeil (f.eks. connection timeout). Én mislykket forespørsel gir umiddelbar feil til brukeren.

**Anbefalt tiltak:**
Implementer exponential backoff i `query()`-funksjonen (maks 3 forsøk, 100ms/300ms/900ms). `pg-pool` støtter ikke dette innebygd — bruk en enkel retry-wrapper.

---

### Ytelse & State

#### P1 — Serverless connection pool overforbruk · `Høy`

**Detaljer:**
`db.ts` oppretter én `pg.Pool` per serverless-invokasjon på Vercel. Med mange parallelle requests kan dette overskride Supabase Free Tier-grensen på 15 samtidige forbindelser og gi "too many clients"-feil.

**Anbefalt tiltak:**
Bytt connection-string til Supabase Session Pooler (host: `aws-0-eu-central-1.pooler.supabase.com`, port 6543). PgBouncer håndterer pooling på Supabase-siden. Reduser `pool.max` til 2 i Pool-konfigurasjonen.

---

#### P2 — portefolje/page.tsx mangler force-dynamic · `Middels`

**Detaljer:**
Portefølje-siden har ikke `export const dynamic = "force-dynamic"`. Next.js kan cache siden statisk, og kurser/porteføljedata vises da som foreldede inntil neste build. Forsiden har riktig oppsett; portefølje-siden har ikke.

**Anbefalt tiltak:**
Legg til `export const dynamic = "force-dynamic"` øverst i `src/app/portefolje/page.tsx`.

---

#### P3 — PiaCoreSection er én monolittisk klient-bundle · `Middels`

**Detaljer:**
`PiaCoreSection.tsx` (~730 linjer) inneholder orb-animasjon, STT, TTS og full chat-logikk i én `"use client"`-komponent. All koden lastes ned selv om brukeren aldri åpner chat. Fitness-siden laster samme bundle.

**Anbefalt tiltak:**
Del opp i lazy-loadede subkomponenter: `const PiaChat = dynamic(() => import('./PiaChat'), { ssr: false })`. Orb kan forbli server-rendert; kun chat-logikken trenger client bundle.

---

#### P4 — Polling-strategi: ingen cache-invalidering · `Lav`

**Detaljer:**
Portefølje-klienten poller hvert 30s uavhengig av om data faktisk er endret. `PortefoljeClient` og `LiveCostSub` har separate polling-intervaller som ikke er koordinert.

**Anbefalt tiltak:**
Vurder Supabase Realtime (`postgres_changes`) i stedet for polling. Alternativt: bruk SWR med `dedupingInterval` for koordinert polling og automatisk cache-invalidering ved window focus.

---

## Konkrete tiltak — prioritert rekkefølge

### Umiddelbart (1–2 timer)

1. Opprett `src/app/api/pia-chat/route.ts` som proxy til n8n. Flytt webhook-URL til `INTERNAL_N8N_WEBHOOK_URL` env-variabel. Klienten kaller kun `/api/pia-chat`.
2. Legg til `X-PIA-Secret`-header i proxy-kallet. Valider headeren i n8n med IF-node. Token lagres i Vercel (`N8N_SHARED_SECRET`) og n8n env.
3. Legg til `export const dynamic = "force-dynamic"` i `portefolje/page.tsx` (én linje).
4. Legg til `AbortController` med 30s timeout i proxy-ruten for n8n-kallet.

### Innen en uke

5. Bytt Supabase connection-string til Session Pooler (port 6543). Sett `pool.max = 2` i `db.ts`.
6. Valider `Origin`-header i `/api/beastmaker` og andre muterende routes.
7. Aktiver Vercel Edge Rate Limiting på `/api/pia-chat` (20 req/min per IP).

### Langsiktig

8. Erstatt polling med Supabase Realtime (`postgres_changes`) for portefølje og kost-data.
9. Del opp `PiaCoreSection` med `next/dynamic` — lazy-load chat-delen separat fra orb-animasjon.
10. Sett opp n8n health-check webhook (cron hvert 5. min) og Cloudflare Worker som sender e-post-varsel ved feil.

---

_Analyse basert på kodebasen per mai 2026. Ingen penetrasjonstest er utført — dette er en statisk kodegjennomgang og arkitekturvurdering._
