// ─── Prosjekter ──────────────────────────────────────────────────────────────

export type ProjectStatus = "aktiv" | "pause" | "fullført" | "idé";

export type Project = {
  id: string;
  name: string;
  description: string;
  status: ProjectStatus;
  stack: string[];
  updatedAt: string;
  progress: number;
};

export const mockProjects: Project[] = [
  {
    id: "p1",
    name: "Jarvis Dashboard",
    description: "Privat dashboard for portefølje, prosjekter og AI-logging.",
    status: "aktiv",
    stack: ["Next.js", "Tailwind", "PostgreSQL"],
    updatedAt: "2026-05-10",
    progress: 20,
  },
  {
    id: "p2",
    name: "Aksjescreener",
    description: "Automatisert screener som henter Oslo Børs-data og rangerer aksjer.",
    status: "pause",
    stack: ["Python", "FastAPI", "React"],
    updatedAt: "2026-04-15",
    progress: 55,
  },
  {
    id: "p3",
    name: "Budsjett-app",
    description: "Personlig budsjett- og utgiftssporing med bankintegrasjon.",
    status: "idé",
    stack: ["Next.js", "Supabase"],
    updatedAt: "2026-03-01",
    progress: 5,
  },
  {
    id: "p4",
    name: "Automatisk nyhetsbrev",
    description: "LLM-basert ukentlig sammendrag av markeds- og teknologinyheter.",
    status: "fullført",
    stack: ["Python", "OpenAI", "SendGrid"],
    updatedAt: "2026-02-20",
    progress: 100,
  },
];

// ─── AI Logger ───────────────────────────────────────────────────────────────

export type LogLevel = "info" | "success" | "warning" | "error";

export type AiLogEntry = {
  id: string;
  timestamp: string;
  model: string;
  prompt: string;
  tokensIn: number;
  tokensOut: number;
  durationMs: number;
  level: LogLevel;
  tags: string[];
};

export const mockAiLogs: AiLogEntry[] = [
  {
    id: "log1",
    timestamp: "2026-05-10T22:45:00",
    model: "gpt-4o",
    prompt: "Oppsummer de siste kvartalsrapportene for EQNR og DNB.",
    tokensIn: 412,
    tokensOut: 890,
    durationMs: 1840,
    level: "success",
    tags: ["portefølje", "analyse"],
  },
  {
    id: "log2",
    timestamp: "2026-05-10T21:10:00",
    model: "claude-3.5-sonnet",
    prompt: "Skriv TypeScript-typer for PostgreSQL-tabellene mine.",
    tokensIn: 220,
    tokensOut: 530,
    durationMs: 950,
    level: "success",
    tags: ["kode", "database"],
  },
  {
    id: "log3",
    timestamp: "2026-05-09T14:30:00",
    model: "gpt-4o-mini",
    prompt: "Generer ukentlig budsjettrapport.",
    tokensIn: 180,
    tokensOut: 0,
    durationMs: 12000,
    level: "error",
    tags: ["budsjett"],
  },
  {
    id: "log4",
    timestamp: "2026-05-08T09:15:00",
    model: "gpt-4o",
    prompt: "Analyser teknisk mønster for AAPL siste 30 dager.",
    tokensIn: 320,
    tokensOut: 710,
    durationMs: 2100,
    level: "info",
    tags: ["teknisk analyse", "aksjer"],
  },
  {
    id: "log5",
    timestamp: "2026-05-07T17:55:00",
    model: "claude-3-opus",
    prompt: "Hjelp med å designe databaseskjema for Jarvis.",
    tokensIn: 550,
    tokensOut: 1240,
    durationMs: 3300,
    level: "success",
    tags: ["database", "arkitektur"],
  },
];

