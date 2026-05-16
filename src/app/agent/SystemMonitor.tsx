"use client";

import { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";

// ── Types ─────────────────────────────────────────────────────────────────────

interface DockerContainer {
  ID?: string;
  Names?: string | string[];
  Name?: string;
  Image?: string;
  Status?: string;
  State?: string;
  Ports?: string;
}

interface ServerStatus {
  temperature: number | null;
  uptime: string | number | null;
  memory_total_mb: number | null;
  memory_used_mb: number | null;
  disk_used_percent: number | string | null;
  disk_used: string | null;
  disk_total: string | null;
  load_average: string | number | null;
  containers: DockerContainer[] | string | null;
  created_at: string;
}

interface AiMetrics {
  calls: number;
  costNok: number;
  costNokFmt: string;
  tokens: number;
}

interface PiaUsageRow {
  execution_id: string | null;
  total_tokens: number | null;
  kostnad_usd: string | number | null;
  tidspunkt: string | null;
}

interface SystemLog {
  id?: number | string;
  created_at?: string;
  message?: string;
  log_message?: string;
  level?: string;
  severity?: string;
  service?: string;
  source?: string;
  flow_name?: string;
  error_message?: string;
  [key: string]: unknown;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function containerName(c: DockerContainer): string {
  const raw = c.Names ?? c.Name ?? c.ID ?? "unknown";
  const str = Array.isArray(raw) ? raw[0] : String(raw);
  return str.replace(/^\//, "");
}

function containerState(c: DockerContainer): "running" | "exited" | "other" {
  const s = (c.State ?? c.Status ?? "").toLowerCase();
  if (s === "running" || s.startsWith("up")) return "running";
  if (s === "exited"  || s.startsWith("exit")) return "exited";
  return "other";
}

function formatUptime(uptime: string | number | null): string {
  if (uptime === null || uptime === undefined) return "—";

  // If it's a string like "up 8 weeks, 3 days, 21 hours, 45 minutes" — parse it
  if (typeof uptime === "string") {
    const wk = uptime.match(/(\d+)\s*week/i);
    const dy = uptime.match(/(\d+)\s*day/i);
    const hr = uptime.match(/(\d+)\s*hour/i);
    const mn = uptime.match(/(\d+)\s*min/i);
    if (wk || dy || hr || mn) {
      const parts: string[] = [];
      if (wk) parts.push(`${wk[1]}w`);
      if (dy) parts.push(`${dy[1]}d`);
      if (hr) parts.push(`${hr[1]}h`);
      if (mn) parts.push(`${mn[1]}m`);
      return parts.join(".");
    }
    // Already formatted or unknown string — return as-is
    return uptime;
  }

  // Numeric seconds
  const s  = Math.floor(uptime);
  const w  = Math.floor(s / 604800);
  const d  = Math.floor((s % 604800) / 86400);
  const h  = Math.floor((s % 86400) / 3600);
  const m  = Math.floor((s % 3600) / 60);
  const parts: string[] = [];
  if (w) parts.push(`${w}w`);
  if (d) parts.push(`${d}d`);
  if (h) parts.push(`${h}h`);
  if (m || parts.length === 0) parts.push(`${m}m`);
  return parts.join(".");
}

function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}

function formatTs(iso?: string): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("nb-NO", {
    month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
  });
}

function tempTextColor(t: number): string {
  if (t < 50) return "text-emerald-400";
  if (t < 70) return "text-yellow-400";
  return "text-red-400";
}

function logLevel(log: SystemLog): "error" | "warn" | "info" {
  const l = (log.level ?? log.severity ?? "").toLowerCase();
  if (l.includes("error") || l.includes("crit")) return "error";
  if (l.includes("warn"))  return "warn";
  return "info";
}

// Try to extract structured fields from the log row, including JSON-encoded message strings
function parsedLog(log: SystemLog): SystemLog {
  // If message/log_message looks like JSON, merge it into the row
  const raw = log.message ?? log.log_message ?? "";
  if (typeof raw === "string" && raw.trimStart().startsWith("{")) {
    try {
      const parsed = JSON.parse(raw) as SystemLog;
      return { ...log, ...parsed };
    } catch {/* not JSON */}
  }
  return log;
}

function logMessage(log: SystemLog): string {
  const p = parsedLog(log);

  // Prefer structured fields
  if (p.flow_name || p.error_message) {
    const parts: string[] = [];
    if (p.flow_name)     parts.push(`Flow: ${p.flow_name}`);
    if (p.error_message) parts.push(`Error: ${p.error_message}`);
    const str = parts.join("  |  ");
    return str.length > 160 ? str.slice(0, 157) + "…" : str;
  }

  // Fall back to message text — first meaningful line only
  const raw = String(p.message ?? p.log_message ?? "");
  if (!raw) return "—";
  const firstLine = raw
    .split(/\r?\n/)
    .map((l) => l.trim())
    .find((l) => l.length > 0 && !l.startsWith("at ") && !l.startsWith("Error:")) ?? raw;
  return firstLine.length > 160 ? firstLine.slice(0, 157) + "…" : firstLine;
}

function logSource(log: SystemLog): string {
  const p = parsedLog(log);
  return String(p.flow_name ?? p.service ?? p.source ?? "");
}

// ── Panel ─────────────────────────────────────────────────────────────────────

function Panel({ title, children, className }: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("rounded-lg border border-border bg-card flex flex-col overflow-hidden", className)}>
      <div className="px-4 py-2 bg-secondary/40 border-b border-border">
        <p className="text-[10px] font-mono font-bold tracking-[0.3em] uppercase text-muted-foreground">
          {title}
        </p>
      </div>
      <div className="flex-1 p-4">
        {children}
      </div>
    </div>
  );
}

// ── Metric row ────────────────────────────────────────────────────────────────

function Metric({ label, value, valueClass = "text-foreground" }: {
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div className="flex items-baseline gap-3">
      <span className="font-mono text-[10px] tracking-widest uppercase text-muted-foreground w-24 shrink-0">
        {label}
      </span>
      <span className={cn("font-mono text-sm font-semibold tabular-nums", valueClass)}>
        {value}
      </span>
    </div>
  );
}

// ── Stat card ─────────────────────────────────────────────────────────────────

function StatCard({ label, value, valueClass = "text-foreground" }: {
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div className="rounded-md border border-border bg-secondary/20 p-3 text-center space-y-1">
      <p className="font-mono text-[9px] tracking-[0.25em] uppercase text-muted-foreground">{label}</p>
      <p className={cn("font-mono text-2xl font-bold tabular-nums", valueClass)}>{value}</p>
    </div>
  );
}

// ── Memory bar ────────────────────────────────────────────────────────────────

function MemBar({ usedMb, totalMb }: { usedMb: number; totalMb: number }) {
  const pct    = Math.min(100, Math.round((usedMb / totalMb) * 100));
  const usedGb  = (usedMb  / 1024).toFixed(1);
  const totalGb = (totalMb / 1024).toFixed(1);

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="font-mono text-[10px] tracking-widest uppercase text-muted-foreground">
          Memory
        </span>
        <span className="font-mono text-xs tabular-nums text-red-400">
          {usedGb} / {totalGb} GB &nbsp;{pct}%
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-secondary/40 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700 bg-red-500"
          style={{ width: `${pct}%`, boxShadow: "0 0 8px rgba(239,68,68,0.6)" }}
        />
      </div>
    </div>
  );
}

// ── Disk bar ──────────────────────────────────────────────────────────────────

function DiskBar({
  pctRaw, used, total,
}: {
  pctRaw: number | string | null;
  used: string | null;
  total: string | null;
}) {
  const pct = Math.min(100, Math.round(Number(String(pctRaw ?? "0").replace("%", ""))));

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="font-mono text-[10px] tracking-widest uppercase text-muted-foreground">
          Root Disk
        </span>
        <span className="font-mono text-xs tabular-nums text-red-400">
          {used ?? "?"} / {total ?? "?"} &nbsp;{pct}%
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-secondary/40 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700 bg-red-500"
          style={{ width: `${pct}%`, boxShadow: "0 0 8px rgba(239,68,68,0.6)" }}
        />
      </div>
    </div>
  );
}

// ── Live blinker ──────────────────────────────────────────────────────────────

function LiveDot() {
  const [on, setOn] = useState(true);
  useEffect(() => {
    const id = setInterval(() => setOn((v) => !v), 900);
    return () => clearInterval(id);
  }, []);
  return (
    <span className={cn("text-emerald-400 transition-opacity", on ? "opacity-100" : "opacity-0")}>
      ●
    </span>
  );
}

// ── AI Metrics panel ──────────────────────────────────────────────────────────

function AiMetricsPanel({
  metrics, rows, loading,
}: {
  metrics: AiMetrics | null;
  rows: PiaUsageRow[];
  loading: boolean;
}) {
  return (
    <Panel title="▸ AI METRICS — pia_usage_log" className="h-full">
      {loading && (
        <p className="font-mono text-xs text-muted-foreground animate-pulse">Laster…</p>
      )}
      {!loading && metrics && (
        <div className="space-y-4">
          {/* Summary stats */}
          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-md border border-border bg-secondary/20 px-2 py-2 text-center">
              <p className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">Analyser</p>
              <p className="font-mono text-lg font-bold tabular-nums text-foreground">
                {metrics.calls.toLocaleString("nb-NO")}
              </p>
            </div>
            <div className="rounded-md border border-border bg-secondary/20 px-2 py-2 text-center">
              <p className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">Kostnad</p>
              <p className="font-mono text-lg font-bold tabular-nums text-primary">
                {metrics.costNokFmt}
              </p>
            </div>
            <div className="rounded-md border border-border bg-secondary/20 px-2 py-2 text-center">
              <p className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">Tokens</p>
              <p className="font-mono text-lg font-bold tabular-nums text-foreground">
                {formatTokens(metrics.tokens)}
              </p>
            </div>
          </div>

          {/* Usage rows table */}
          {rows.length > 0 ? (
            <div className="border-t border-border pt-3 space-y-1">
              {/* Table header */}
              <div className="flex items-center gap-2 font-mono text-[9px] tracking-widest uppercase text-muted-foreground pb-1 border-b border-border/60">
                <span className="flex-1 truncate">Execution ID</span>
                <span className="w-16 text-right shrink-0">Tokens</span>
                <span className="w-16 text-right shrink-0">USD</span>
              </div>
              {/* Rows */}
              <div className="space-y-0 max-h-48 overflow-y-auto">
                {rows.map((r, i) => (
                  <div
                    key={r.execution_id ?? i}
                    className="flex items-center gap-2 py-1 border-b border-border/30 last:border-0"
                  >
                    <span className="font-mono text-[10px] text-muted-foreground flex-1 truncate">
                      {r.execution_id ?? "—"}
                    </span>
                    <span className="font-mono text-[10px] tabular-nums text-foreground w-16 text-right shrink-0">
                      {r.total_tokens != null ? Number(r.total_tokens).toLocaleString("nb-NO") : "—"}
                    </span>
                    <span className="font-mono text-[10px] tabular-nums text-primary w-16 text-right shrink-0">
                      {r.kostnad_usd != null ? Number(r.kostnad_usd).toFixed(4) : "—"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            !loading && (
              <p className="font-mono text-[10px] text-muted-foreground pt-2 border-t border-border">
                Ingen rader i pia_usage_log ennå.
              </p>
            )
          )}
        </div>
      )}
    </Panel>
  );
}

// ── System logs panel ─────────────────────────────────────────────────────────

function SystemLogsPanel({ logs, loading }: { logs: SystemLog[]; loading: boolean }) {
  return (
    <Panel title="▸ SYSTEM LOGS">
      {loading && (
        <p className="font-mono text-xs text-muted-foreground animate-pulse">Laster…</p>
      )}
      {!loading && logs.length === 0 && (
        <p className="font-mono text-xs text-muted-foreground">
          Ingen logger funnet i system_logs-tabellen.
        </p>
      )}
      {!loading && logs.length > 0 && (
        <div className="overflow-x-auto">
          {/* Header */}
          <div className="flex items-center gap-3 pb-2 mb-1 border-b border-border font-mono text-[9px] tracking-widest uppercase text-muted-foreground">
            <span className="w-32 shrink-0">Tidspunkt</span>
            <span className="w-16 shrink-0">Nivå</span>
            <span className="w-24 shrink-0">Kilde</span>
            <span className="flex-1">Melding</span>
          </div>

          <div className="space-y-0.5 max-h-64 overflow-y-auto pr-1">
            {logs.map((log, i) => {
              const p      = parsedLog(log);
              const lvl    = logLevel(p);
              const lvlClass =
                lvl === "error" ? "text-red-400" :
                lvl === "warn"  ? "text-yellow-400" :
                "text-muted-foreground";
              const lvlBg =
                lvl === "error" ? "bg-red-500/10" :
                lvl === "warn"  ? "bg-yellow-500/10" :
                "";

              return (
                <div
                  key={p.id ?? i}
                  className={cn(
                    "flex items-start gap-3 rounded px-1.5 py-1 font-mono text-xs",
                    lvlBg
                  )}
                >
                  <span className="w-32 shrink-0 tabular-nums text-muted-foreground text-[10px]">
                    {formatTs(String(p.created_at ?? log.created_at ?? ""))}
                  </span>
                  <span className={cn("w-16 shrink-0 font-semibold text-[10px] uppercase", lvlClass)}>
                    {String(p.level ?? p.severity ?? lvl)}
                  </span>
                  <span className="w-24 shrink-0 text-muted-foreground text-[10px] truncate">
                    {logSource(log)}
                  </span>
                  <span className="flex-1 text-foreground/80 leading-snug break-words text-[11px]">
                    {logMessage(log)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </Panel>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

const POLL_MS = 15_000;

export function SystemMonitor() {
  const [status,   setStatus]   = useState<ServerStatus | null>(null);
  const [metrics,  setMetrics]  = useState<AiMetrics | null>(null);
  const [usageRows, setUsageRows] = useState<PiaUsageRow[]>([]);
  const [logs,     setLogs]     = useState<SystemLog[]>([]);
  const [sLoad,    setSLoad]    = useState(true);
  const [mLoad,    setMLoad]    = useState(true);
  const [lLoad,    setLLoad]    = useState(true);
  const [lastSeen, setLastSeen] = useState<Date | null>(null);

  const fetchStatus = useCallback(async () => {
    try {
      const r = await fetch("/api/server-status");
      const d = await r.json() as { status: ServerStatus | null };
      if (d.status) { setStatus(d.status); setLastSeen(new Date()); }
    } catch {/* */}
    finally { setSLoad(false); }
  }, []);

  const fetchMetrics = useCallback(async () => {
    try {
      const r = await fetch("/api/pia-usage");
      const d = await r.json() as {
        calls: number; totalTokens: number; costNok: number; costNokFmt: string;
        rows: PiaUsageRow[];
      };
      setMetrics({ calls: d.calls, costNok: d.costNok, costNokFmt: d.costNokFmt, tokens: d.totalTokens });
      setUsageRows(d.rows ?? []);
    } catch {/* */}
    finally { setMLoad(false); }
  }, []);

  const fetchLogs = useCallback(async () => {
    try {
      const r = await fetch("/api/system-logs");
      const d = await r.json() as { logs: SystemLog[] };
      setLogs(d.logs ?? []);
    } catch {/* */}
    finally { setLLoad(false); }
  }, []);

  useEffect(() => {
    fetchStatus();
    fetchMetrics();
    fetchLogs();
    const id = setInterval(() => { fetchStatus(); fetchLogs(); }, POLL_MS);
    return () => clearInterval(id);
  }, [fetchStatus, fetchMetrics, fetchLogs]);

  const containers: DockerContainer[] = (() => {
    const raw = status?.containers;
    if (!raw) return [];
    if (typeof raw === "string") {
      try { return JSON.parse(raw) as DockerContainer[]; } catch { return []; }
    }
    if (Array.isArray(raw)) return raw as DockerContainer[];
    return [];
  })();
  const running = containers.filter((c) => containerState(c) === "running").length;
  const temp    = status?.temperature ?? null;

  return (
    <div className="p-4 md:p-6 space-y-4 min-h-screen bg-background">

      {/* Title bar */}
      <div className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-2.5">
        <div className="flex items-center gap-2.5">
          <LiveDot />
          <span className="font-mono text-sm font-bold tracking-[0.3em] uppercase text-foreground">
            Master OS <span className="text-muted-foreground font-normal">{"// System Monitor"}</span>
          </span>
        </div>
        <div className="flex items-center gap-4 font-mono text-[10px] text-muted-foreground">
          {lastSeen && (
            <span>
              Sist oppdatert:{" "}
              <span className="tabular-nums text-foreground">
                {lastSeen.toLocaleTimeString("nb-NO")}
              </span>
            </span>
          )}
          <span>
            Poller hvert{" "}
            <span className="text-primary">{POLL_MS / 1000}s</span>
          </span>
        </div>
      </div>

      {/* Top grid: Server + AI */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Server status — 2 cols */}
        <div className="lg:col-span-2 space-y-4">

          {/* Hardware */}
          <Panel title="▸ SERVER STATUS">
            {sLoad && (
              <p className="font-mono text-xs text-muted-foreground animate-pulse">
                Kobler til…
              </p>
            )}
            {!sLoad && !status && (
              <p className="font-mono text-xs text-red-400">
                Ingen data — sjekk at n8n sender til server_status-tabellen.
              </p>
            )}
            {!sLoad && status && (
              <div className="space-y-4">
                {/* Stat cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {temp !== null && (
                    <StatCard
                      label="Temperatur"
                      value={`${temp.toFixed(1)}°C`}
                      valueClass={tempTextColor(temp)}
                    />
                  )}
                  <StatCard label="Oppetid" value={formatUptime(status.uptime)} />
                  {status.load_average != null && (
                    <StatCard
                      label="Load Avg"
                      value={String(status.load_average)}
                      valueClass="text-primary"
                    />
                  )}
                  <StatCard
                    label="Containere"
                    value={`${running} / ${containers.length}`}
                    valueClass="text-primary"
                  />
                </div>

                {/* Memory + Disk bars */}
                <div className="rounded-md border border-border bg-secondary/20 p-4 space-y-5">
                  {status.memory_total_mb && (
                    <MemBar
                      usedMb={status.memory_used_mb ?? 0}
                      totalMb={status.memory_total_mb}
                    />
                  )}
                  {status.disk_used_percent != null && (
                    <DiskBar
                      pctRaw={status.disk_used_percent}
                      used={status.disk_used}
                      total={status.disk_total}
                    />
                  )}
                </div>

                <Metric
                  label="Data fra"
                  value={new Date(status.created_at).toLocaleString("nb-NO")}
                />
              </div>
            )}
          </Panel>

          {/* Docker containers */}
          <Panel title={`▸ DOCKER CONTAINERS — ${running} kjørende / ${containers.length} totalt`}>
            {sLoad && (
              <p className="font-mono text-xs text-muted-foreground animate-pulse">Laster…</p>
            )}
            {!sLoad && containers.length === 0 && (
              <p className="font-mono text-xs text-muted-foreground">
                Ingen container-data. Sjekk JSONB-feltet i server_status.
              </p>
            )}
            {containers.length > 0 && (
              <div className="space-y-0">
                {/* Header */}
                <div className="flex items-center gap-3 pb-2 mb-1 border-b border-border font-mono text-[9px] tracking-widest uppercase text-muted-foreground">
                  <span className="w-3 shrink-0" />
                  <span className="flex-1">Navn</span>
                  <span className="w-32 text-right shrink-0">Image</span>
                  <span className="w-36 text-right shrink-0">Status</span>
                </div>

                {containers.map((c, i) => {
                  const state = containerState(c);
                  const dotClass =
                    state === "running" ? "text-emerald-400" :
                    state === "exited"  ? "text-red-400" :
                    "text-yellow-400";
                  return (
                    <div
                      key={c.ID ?? i}
                      className="flex items-center gap-3 py-1.5 border-b border-border/40 last:border-0"
                    >
                      <span className={cn("text-xs shrink-0", dotClass)}>●</span>
                      <span className="font-mono text-xs text-foreground flex-1 truncate">
                        {containerName(c)}
                      </span>
                      <span className="font-mono text-[10px] text-muted-foreground w-32 text-right shrink-0 truncate">
                        {c.Image ?? "—"}
                      </span>
                      <span className={cn(
                        "font-mono text-[10px] w-36 text-right shrink-0",
                        state === "running" ? "text-emerald-400/70" : "text-red-400/70"
                      )}>
                        {c.Status ?? c.State ?? "—"}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </Panel>

        </div>

        {/* AI Metrics */}
        <AiMetricsPanel metrics={metrics} rows={usageRows} loading={mLoad} />

      </div>

      {/* System logs — full width */}
      <SystemLogsPanel logs={logs} loading={lLoad} />

      {/* Footer */}
      <p className="font-mono text-[9px] tracking-widest uppercase text-center text-muted-foreground/30 pt-2">
        {"master-os v0.1 // jarvis dashboard //"} {new Date().getFullYear()}
      </p>
    </div>
  );
}
