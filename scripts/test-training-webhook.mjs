/**
 * Feilsøk N8N_TRAINING_WEBHOOK_URL — kjør: node scripts/test-training-webhook.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const env = fs.readFileSync(path.join(root, ".env.local"), "utf8");
const urlLine = env.split(/\r?\n/).find((l) => l.startsWith("N8N_TRAINING_WEBHOOK_URL="));
const secretLine = env.split(/\r?\n/).find((l) => l.startsWith("PIA_WEBHOOK_SECRET="));

if (!urlLine) {
  console.error("N8N_TRAINING_WEBHOOK_URL mangler i .env.local");
  process.exit(1);
}

let url = urlLine.slice("N8N_TRAINING_WEBHOOK_URL=".length).trim();
if (url.startsWith('"') && url.endsWith('"')) url = url.slice(1, -1);

const headers = { "Content-Type": "application/json" };
if (secretLine) {
  let secret = secretLine.slice("PIA_WEBHOOK_SECRET=".length).trim();
  if (secret.startsWith('"') && secret.endsWith('"')) secret = secret.slice(1, -1);
  headers["x-pia-secret"] = secret;
}

const payload = {
  test: true,
  protocol_type: "Max Hangs",
  session_id: 0,
  hang_logs: [],
};

console.log("URL type:", url.includes("/webhook-test/") ? "TEST" : url.includes("/webhook/") ? "PRODUCTION" : "UNKNOWN");
console.log("Host:", new URL(url).host);
console.log("POST …");

const res = await fetch(url, {
  method: "POST",
  headers,
  body: JSON.stringify(payload),
});

const text = await res.text();
console.log("Status:", res.status, res.statusText);
console.log("Body (first 500 chars):", text.slice(0, 500));

if (res.status === 404) {
  console.log("\n--- 404 vanlige årsaker i n8n ---");
  if (url.includes("/webhook-test/")) {
    console.log("1. TEST-URL: Åpne workflow i n8n og klikk «Listen for test event» på Webhook-noden.");
    console.log("2. Eller bytt til PRODUCTION-URL (/webhook/...) og sett workflow til Active.");
  } else {
    console.log("1. PRODUCTION-URL: Workflow må være slått PÅ (Active) i n8n.");
    console.log("2. Sjekk at Webhook-path/ID matcher URL-en (kopier fra Webhook-noden).");
  }
  console.log("3. HTTP-metode må være POST (samme som i Webhook-noden).");
}
