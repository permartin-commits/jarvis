import { google } from "googleapis";

const TIMEZONE = "Europe/Oslo";

export interface GmailMessage {
  id: string;
  sender: string;
  subject: string;
  time: string;
  isUnread: boolean;
}

export interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  isToday: boolean;
  isTomorrow: boolean;
}

export interface GmailMessageDetail extends GmailMessage {
  fromEmail: string;
  to: string;
  bodyHtml: string | null;
  bodyText: string | null;
}

export interface CalendarEventDetail {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  startTime: string;
  endTime: string;
  isAllDay: boolean;
  htmlLink: string | null;
}

let oauthClient: InstanceType<typeof google.auth.OAuth2> | null = null;

function getOAuth2Client() {
  if (oauthClient) return oauthClient;

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error(
      "Google OAuth mangler: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET eller GOOGLE_REFRESH_TOKEN"
    );
  }

  oauthClient = new google.auth.OAuth2(clientId, clientSecret);
  oauthClient.setCredentials({ refresh_token: refreshToken });
  return oauthClient;
}

function parseFromHeader(from: string): { name: string; email: string } {
  const trimmed = from.trim();
  const match = trimmed.match(/^(.+?)\s*<([^>]+)>$/);
  if (match) {
    return {
      name: match[1].replace(/^"|"$/g, "").trim(),
      email: match[2].trim(),
    };
  }
  if (trimmed.includes("@")) {
    return { name: trimmed, email: trimmed };
  }
  return { name: trimmed, email: "" };
}

function headerValue(
  headers: { name?: string | null; value?: string | null }[] | undefined,
  name: string
): string {
  return headers?.find((h) => h.name?.toLowerCase() === name.toLowerCase())?.value ?? "";
}

function osloDateKey(d: Date): string {
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

function isSameOsloDay(a: Date, b: Date): boolean {
  return osloDateKey(a) === osloDateKey(b);
}

export async function fetchGmailMessages(): Promise<GmailMessage[]> {
  const auth = getOAuth2Client();
  const gmail = google.gmail({ version: "v1", auth });

  const list = await gmail.users.messages.list({
    userId: "me",
    maxResults: 10,
    labelIds: ["INBOX"],
  });

  const ids = (list.data.messages ?? [])
    .map((m) => m.id)
    .filter((id): id is string => Boolean(id));

  if (ids.length === 0) return [];

  const messages = await Promise.all(
    ids.map(async (id) => {
      const msg = await gmail.users.messages.get({
        userId: "me",
        id,
        format: "metadata",
        metadataHeaders: ["From", "Subject", "Date"],
      });

      const fromRaw = headerValue(msg.data.payload?.headers, "From");
      const { name, email } = parseFromHeader(fromRaw);
      const subject = headerValue(msg.data.payload?.headers, "Subject") || "(Uten emne)";
      const dateHeader = headerValue(msg.data.payload?.headers, "Date");
      const time = dateHeader
        ? new Date(dateHeader).toISOString()
        : new Date(Number(msg.data.internalDate ?? Date.now())).toISOString();

      return {
        id,
        sender: name || email || "Ukjent",
        subject,
        time,
        isUnread: (msg.data.labelIds ?? []).includes("UNREAD"),
      } satisfies GmailMessage;
    })
  );

  return messages;
}

export async function fetchCalendarEvents(): Promise<CalendarEvent[]> {
  const auth = getOAuth2Client();
  const calendar = google.calendar({ version: "v3", auth });

  const now = new Date();
  const timeMin = now.toISOString();
  const timeMax = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();

  const res = await calendar.events.list({
    calendarId: "primary",
    timeMin,
    timeMax,
    singleEvents: true,
    orderBy: "startTime",
    maxResults: 100,
    timeZone: TIMEZONE,
  });

  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  return (res.data.items ?? [])
    .filter((ev) => ev.id && (ev.start?.dateTime || ev.start?.date))
    .map((ev) => {
      const startIso = ev.start!.dateTime ?? `${ev.start!.date}T00:00:00`;
      const endIso = ev.end!.dateTime ?? `${ev.end!.date}T23:59:59`;
      const startDate = new Date(startIso);

      return {
        id: ev.id!,
        title: ev.summary ?? "(Uten tittel)",
        date: osloDateKey(startDate),
        startTime: startIso,
        endTime: endIso,
        isToday: isSameOsloDay(startDate, today),
        isTomorrow: isSameOsloDay(startDate, tomorrow),
      } satisfies CalendarEvent;
    });
}

function decodeBase64Url(data: string): string {
  const normalized = data.replace(/-/g, "+").replace(/_/g, "/");
  return Buffer.from(normalized, "base64").toString("utf-8");
}

function extractBody(
  payload: { mimeType?: string | null; body?: { data?: string | null } | null; parts?: unknown[] } | undefined
): { html: string | null; text: string | null } {
  if (!payload) return { html: null, text: null };

  if (payload.body?.data) {
    const decoded = decodeBase64Url(payload.body.data);
    if (payload.mimeType === "text/html") return { html: decoded, text: null };
    if (payload.mimeType === "text/plain") return { html: null, text: decoded };
  }

  let html: string | null = null;
  let text: string | null = null;
  for (const part of payload.parts ?? []) {
    const nested = extractBody(part as typeof payload);
    if (nested.html) html = nested.html;
    if (nested.text) text = nested.text;
  }
  return { html, text };
}

export async function fetchGmailMessageById(id: string): Promise<GmailMessageDetail> {
  const auth = getOAuth2Client();
  const gmail = google.gmail({ version: "v1", auth });

  const msg = await gmail.users.messages.get({
    userId: "me",
    id,
    format: "full",
  });

  const headers = msg.data.payload?.headers;
  const fromRaw = headerValue(headers, "From");
  const { name, email } = parseFromHeader(fromRaw);
  const subject = headerValue(headers, "Subject") || "(Uten emne)";
  const to = headerValue(headers, "To");
  const dateHeader = headerValue(headers, "Date");
  const time = dateHeader
    ? new Date(dateHeader).toISOString()
    : new Date(Number(msg.data.internalDate ?? Date.now())).toISOString();

  const { html, text } = extractBody(msg.data.payload ?? undefined);

  return {
    id,
    sender: name || email || "Ukjent",
    fromEmail: email,
    to,
    subject,
    time,
    isUnread: (msg.data.labelIds ?? []).includes("UNREAD"),
    bodyHtml: html,
    bodyText: text,
  };
}

export async function fetchCalendarEventById(id: string): Promise<CalendarEventDetail> {
  const auth = getOAuth2Client();
  const calendar = google.calendar({ version: "v3", auth });

  const res = await calendar.events.get({
    calendarId: "primary",
    eventId: id,
    timeZone: TIMEZONE,
  });

  const ev = res.data;
  const isAllDay = Boolean(ev.start?.date && !ev.start?.dateTime);
  const startTime = ev.start?.dateTime ?? `${ev.start?.date}T00:00:00`;
  const endTime = ev.end?.dateTime ?? `${ev.end?.date}T23:59:59`;

  return {
    id,
    title: ev.summary ?? "(Uten tittel)",
    description: ev.description ?? null,
    location: ev.location ?? null,
    startTime,
    endTime,
    isAllDay,
    htmlLink: ev.htmlLink ?? null,
  };
}
