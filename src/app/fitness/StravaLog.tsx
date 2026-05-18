"use client";

import { useState, useEffect, useMemo } from "react";
import dynamic from "next/dynamic";
import {
  Activity, X, Zap, Map, Heart, Flame, Mountain,
  Target, Lightbulb, TrendingUp, Route, Hash,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const RouteMap = dynamic(
  () => import("@/components/RouteMap").then((m) => m.RouteMap),
  { ssr: false, loading: () => <div className="w-full h-full bg-zinc-950" /> }
);

// ── Distance goals config ──────────────────────────────────────────────────────

const DISTANCES = [
  { id: "5km",          navn: "5 km",         km: 5.0 },
  { id: "10km",         navn: "10 km",         km: 10.0 },
  { id: "21km",         navn: "Halvmaraton",   km: 21.0975 },
  { id: "42km",         navn: "Maraton",       km: 42.195 },
  { id: "skogvokteren", navn: "Skogvokteren",  km: 88.0 },
] as const;

// ── Types ─────────────────────────────────────────────────────────────────────

interface RawStrava {
  map?: { summary_polyline?: string };
  [key: string]: unknown;
}

interface StravaActivity {
  id: number;
  strava_id: string;
  dato: string;
  navn: string | null;
  type: string | null;
  distanse_km: string | null;
  varighet_sekunder: number | null;
  gjennomsnittsfart_kmt: string | null;
  hoydemeter: string | null;
  gjennomsnittspuls: number | null;
  maxpuls: number | null;
  kalorier: number | null;
  raw: RawStrava | null;
  analyse_av_okt: string | null;
  progresjonsanalyse: string | null;
}

interface LopeMal {
  distanse_id: string;
  mal_tid_sekunder: number | null;
}

// ── Time helpers ──────────────────────────────────────────────────────────────

function parseTime(input: string): number | null {
  const cleaned = input.trim();
  if (!cleaned) return null;
  const parts = cleaned.split(":").map(Number);
  if (parts.some((n) => isNaN(n) || n < 0)) return null;
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  return null;
}

function secondsToTimeStr(s: number): string {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}:${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

function formatPace(secPerKm: number): string {
  const m = Math.floor(secPerKm / 60);
  const s = Math.round(secPerKm % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

// ── Activity helpers ──────────────────────────────────────────────────────────

function formatDuration(s: number): string {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return h > 0
    ? `${h}t ${m.toString().padStart(2, "0")}m`
    : `${m}:${sec.toString().padStart(2, "0")}`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("nb-NO", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("nb-NO", {
    hour: "2-digit", minute: "2-digit",
  });
}

function activityIcon(type: string | null): string {
  switch ((type ?? "").toLowerCase()) {
    case "run":        return "🏃";
    case "ride":       return "🚴";
    case "swim":       return "🏊";
    case "hike":       return "🥾";
    case "walk":       return "🚶";
    case "climbinggym":
    case "climbing":   return "🧗";
    case "workout":    return "💪";
    default:           return "⚡";
  }
}

function getPolyline(activity: StravaActivity): string | null {
  return activity.raw?.map?.summary_polyline ?? null;
}

function computeStravaSummary(activities: StravaActivity[]) {
  let totalKm = 0;
  let totalSec = 0;
  for (const a of activities) {
    const km = a.distanse_km != null ? Number(a.distanse_km) : 0;
    const sec = a.varighet_sekunder ?? 0;
    if (Number.isFinite(km) && km > 0) totalKm += km;
    if (sec > 0) totalSec += sec;
  }
  const avgPaceSec = totalKm > 0 && totalSec > 0 ? totalSec / totalKm : null;
  return {
    count: activities.length,
    totalKmFmt:
      totalKm > 0
        ? totalKm.toLocaleString("nb-NO", { maximumFractionDigits: 1 })
        : "—",
    avgPaceFmt: avgPaceSec != null ? `${formatPace(avgPaceSec)}/km` : "—",
  };
}

function StravaHeaderStat({
  icon,
  label,
  value,
  loading,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  loading?: boolean;
}) {
  return (
    <div className="flex min-w-0 flex-1 flex-col gap-0.5 rounded-lg border border-orange-500/15 bg-orange-500/[0.06] px-2.5 py-2 sm:px-3">
      <div className="flex items-center gap-1 text-orange-400/80">
        {icon}
        <span className="truncate text-[9px] font-semibold uppercase tracking-wider sm:text-[10px]">
          {label}
        </span>
      </div>
      <p
        className={cn(
          "text-sm font-bold tabular-nums text-foreground sm:text-base",
          loading && "animate-pulse text-muted-foreground/40"
        )}
      >
        {loading ? "…" : value}
      </p>
    </div>
  );
}

// ── StatChip ──────────────────────────────────────────────────────────────────

function StatChip({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border/60 bg-secondary/30 px-3 py-2.5 space-y-1">
      <div className="flex items-center gap-1.5 text-muted-foreground">
        {icon}
        <span className="text-[10px] uppercase tracking-wide">{label}</span>
      </div>
      <p className="text-sm font-semibold text-foreground tabular-nums">{value}</p>
    </div>
  );
}

// ── Detail Modal ──────────────────────────────────────────────────────────────

function DetailModal({ activity, onClose }: { activity: StravaActivity; onClose: () => void }) {
  const polylineStr = getPolyline(activity);
  const title       = activity.navn ?? activity.type ?? "Aktivitet";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl border border-border bg-card shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Map / header */}
        <div className="relative h-44 shrink-0 bg-zinc-950">
          {polylineStr ? (
            <RouteMap encodedPolyline={polylineStr} />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-6xl opacity-10">{activityIcon(activity.type)}</span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/75 pointer-events-none" />
          <button
            onClick={onClose}
            className="absolute top-3 right-3 rounded-full bg-black/40 p-1.5 text-white/80 hover:text-white hover:bg-black/60 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
          <div className="absolute bottom-3 left-4 right-12">
            <p className="text-sm font-semibold text-white leading-snug truncate">{title}</p>
            <p className="text-[11px] text-white/65">{formatDate(activity.dato)} · {formatTime(activity.dato)}</p>
          </div>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto p-4 space-y-4">
          <div className="grid grid-cols-2 gap-2.5">
            {activity.distanse_km != null && (
              <StatChip icon={<Map className="h-3.5 w-3.5" />} label="Distanse" value={`${Number(activity.distanse_km).toFixed(2)} km`} />
            )}
            {activity.varighet_sekunder != null && (
              <StatChip icon={<Zap className="h-3.5 w-3.5" />} label="Varighet" value={formatDuration(activity.varighet_sekunder)} />
            )}
            {activity.gjennomsnittsfart_kmt != null && (
              <StatChip icon={<Activity className="h-3.5 w-3.5" />} label="Snittfart" value={`${Number(activity.gjennomsnittsfart_kmt).toFixed(1)} km/t`} />
            )}
            {activity.hoydemeter != null && (
              <StatChip icon={<Mountain className="h-3.5 w-3.5" />} label="Høydemeter" value={`${activity.hoydemeter} m`} />
            )}
            {activity.gjennomsnittspuls != null && (
              <StatChip icon={<Heart className="h-3.5 w-3.5" />} label="Snittpuls" value={`${activity.gjennomsnittspuls} bpm`} />
            )}
            {activity.maxpuls != null && (
              <StatChip icon={<Heart className="h-3.5 w-3.5" />} label="Makspuls" value={`${activity.maxpuls} bpm`} />
            )}
            {activity.kalorier != null && (
              <StatChip icon={<Flame className="h-3.5 w-3.5" />} label="Kalorier" value={`${activity.kalorier} kcal`} />
            )}
          </div>

          {activity.analyse_av_okt && (
            <div className="rounded-lg border border-primary/25 bg-primary/5 px-4 py-3 space-y-1.5">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-primary/70">Analyse av økt</p>
              <p className="text-sm text-foreground/85 leading-relaxed whitespace-pre-wrap">{activity.analyse_av_okt}</p>
            </div>
          )}

          {activity.progresjonsanalyse && (
            <div className="rounded-lg border border-border/60 bg-secondary/30 px-4 py-3 space-y-1.5">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Progresjonsanalyse</p>
              <p className="text-sm text-foreground/85 leading-relaxed whitespace-pre-wrap">{activity.progresjonsanalyse}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Goal Modal ────────────────────────────────────────────────────────────────

function GoalModal({ onClose }: { onClose: () => void }) {
  const [times, setTimes]   = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved]   = useState(false);

  useEffect(() => {
    fetch("/api/lope-mal")
      .then((r) => r.json())
      .then((d) => {
        const t: Record<string, string> = {};
        for (const row of (d.goals as LopeMal[]) ?? []) {
          if (row.mal_tid_sekunder) {
            t[row.distanse_id] = secondsToTimeStr(row.mal_tid_sekunder);
          }
        }
        setTimes(t);
      })
      .catch(() => {});
  }, []);

  async function handleSave() {
    setSaving(true);
    await Promise.all(
      DISTANCES.map((d) => {
        const sek = parseTime(times[d.id] ?? "");
        return fetch("/api/lope-mal", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            distanse_id:      d.id,
            distanse_navn:    d.navn,
            distanse_km:      d.km,
            mal_tid_sekunder: sek,
          }),
        });
      })
    );
    setSaving(false);
    setSaved(true);
    setTimeout(onClose, 800);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-2xl border border-border bg-card shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between px-5 pt-5 pb-4 border-b border-border">
          <div>
            <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Target className="h-4 w-4 text-primary" />
              Definer løpemål
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Skriv inn måltid — pace beregnes automatisk
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1.5 text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Column headers */}
        <div className="flex items-center gap-3 px-5 py-2 bg-secondary/20 border-b border-border/60 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
          <span className="w-28 shrink-0">Måltid</span>
          <span className="flex-1">Distanse</span>
          <span className="text-right w-24 shrink-0">Pace / fart</span>
        </div>

        {/* Distance rows */}
        <div className="px-5 py-4 space-y-3">
          {DISTANCES.map((d) => {
            const sek   = parseTime(times[d.id] ?? "");
            const pace  = sek ? formatPace(sek / d.km) : null;
            const speed = sek ? (d.km / (sek / 3600)).toFixed(1) : null;

            return (
              <div key={d.id} className="flex items-center gap-3">
                <input
                  type="text"
                  value={times[d.id] ?? ""}
                  onChange={(e) => setTimes((prev) => ({ ...prev, [d.id]: e.target.value }))}
                  placeholder={d.km >= 42 ? "T:MM:SS" : "MM:SS"}
                  className="w-28 shrink-0 rounded-lg border border-border bg-secondary/20 px-3 py-2 text-sm font-mono text-foreground placeholder:text-muted-foreground/40 outline-none focus:border-primary/50 transition-colors tabular-nums"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">{d.navn}</p>
                  <p className="text-[10px] text-muted-foreground">{d.km} km</p>
                </div>
                <div className="w-24 shrink-0 text-right">
                  {pace ? (
                    <>
                      <p className="text-xs font-semibold text-foreground tabular-nums">{pace} /km</p>
                      <p className="text-[10px] text-muted-foreground tabular-nums">{speed} km/t</p>
                    </>
                  ) : (
                    <p className="text-xs text-muted-foreground/30">—</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Save */}
        <div className="px-5 pb-5">
          <button
            onClick={handleSave}
            disabled={saving || saved}
            className={cn(
              "w-full rounded-lg py-2.5 text-sm font-semibold transition-all",
              saved
                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                : saving
                ? "bg-primary/30 text-primary/60 cursor-wait"
                : "bg-primary text-primary-foreground hover:bg-primary/90 active:scale-[0.98]"
            )}
          >
            {saved ? "Lagret ✓" : saving ? "Lagrer…" : "Lagre mål"}
          </button>
        </div>
      </div>
    </div>
  );
}

const PREVIEW_COUNT = 5;

// ── Main component ────────────────────────────────────────────────────────────

export function StravaLog() {
  const [activities, setActivities]     = useState<StravaActivity[]>([]);
  const [selected, setSelected]         = useState<StravaActivity | null>(null);
  const [loading, setLoading]           = useState(true);
  const [forslag, setForslag]           = useState<string | null>(null);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [showAll, setShowAll]           = useState(false);

  useEffect(() => {
    fetch("/api/strava-activities")
      .then((r) => r.json())
      .then((d) => setActivities((d.activities as StravaActivity[]) ?? []))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (forslag !== null) return;
    fetch("/api/strava-forslag")
      .then((r) => r.json())
      .then((d) => setForslag(d.forslag ?? ""))
      .catch(() => {});
  }, [forslag]);

  const visibleActivities = showAll
    ? activities
    : activities.slice(0, PREVIEW_COUNT);
  const hasMore = activities.length > PREVIEW_COUNT;

  const summary = useMemo(() => computeStravaSummary(activities), [activities]);
  const latestActivity = activities[0] ?? null;
  const latestProgresjon = latestActivity?.progresjonsanalyse?.trim() ?? "";

  return (
    <div className="rounded-xl border border-border overflow-hidden">

      {selected && (
        <DetailModal activity={selected} onClose={() => setSelected(null)} />
      )}

      {showGoalModal && (
        <GoalModal onClose={() => setShowGoalModal(false)} />
      )}

      <header className="border-b border-border bg-gradient-to-br from-orange-500/[0.07] via-card to-card px-4 py-4">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-orange-500/15 ring-1 ring-orange-500/25 shadow-sm shadow-orange-500/10">
            <Activity className="h-4 w-4 text-orange-400" />
          </div>
          <div className="min-w-0 flex-1 pt-0.5">
            <h2 className="text-sm font-semibold tracking-tight text-foreground">Strava</h2>
          </div>
          <button
            type="button"
            onClick={() => setShowGoalModal(true)}
            className="flex shrink-0 items-center gap-1.5 rounded-lg border border-orange-500/25 bg-orange-500/10 px-2.5 py-1.5 text-[11px] font-semibold text-orange-300/90 transition-colors hover:border-orange-500/40 hover:bg-orange-500/15 hover:text-orange-200"
          >
            <Target className="h-3.5 w-3.5" />
            Mål
          </button>
        </div>

        <div className="mt-3 grid grid-cols-3 gap-2">
          <StravaHeaderStat
            icon={<Route className="h-3 w-3 shrink-0" />}
            label="Totale KM"
            value={summary.totalKmFmt === "—" ? summary.totalKmFmt : `${summary.totalKmFmt} km`}
            loading={loading}
          />
          <StravaHeaderStat
            icon={<Hash className="h-3 w-3 shrink-0" />}
            label="Antall aktivitet"
            value={String(summary.count)}
            loading={loading}
          />
          <StravaHeaderStat
            icon={<Zap className="h-3 w-3 shrink-0" />}
            label="Snitt tempo"
            value={summary.avgPaceFmt}
            loading={loading}
          />
        </div>
      </header>

      <div className="border-t border-border">
          <Card className="rounded-none border-0 bg-card overflow-hidden">
            {loading ? (
              <CardContent className="py-10 text-center text-xs text-muted-foreground">
                Laster aktiviteter…
              </CardContent>
            ) : activities.length === 0 ? (
              <CardContent className="py-10 flex flex-col items-center gap-3 text-center">
                <div className="h-12 w-12 rounded-full bg-orange-500/5 flex items-center justify-center ring-1 ring-orange-500/20">
                  <Activity className="h-5 w-5 text-orange-400/40" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-foreground/70">Ingen aktiviteter ennå</p>
                  <p className="text-xs text-muted-foreground max-w-xs">
                    Koble til Strava via n8n og push data til <code className="font-mono">Strava</code>-tabellen i Supabase.
                  </p>
                </div>
              </CardContent>
            ) : (
              <CardContent className="p-0">

                {/* Progresjonsanalyse — siste aktivitet */}
                <div className="border-b border-border/60 bg-gradient-to-r from-orange-500/[0.06] to-transparent px-4 py-3.5">
                  <div className="flex gap-3">
                    <TrendingUp className="mt-0.5 h-4 w-4 shrink-0 text-orange-400/80" />
                    <div className="min-w-0 flex-1 space-y-1">
                      <p className="text-[10px] font-semibold uppercase tracking-widest text-orange-400/80">
                        Progresjonsanalyse
                      </p>
                      {latestProgresjon ? (
                        <p className="text-sm leading-relaxed text-foreground/85 whitespace-pre-wrap">
                          {latestProgresjon}
                        </p>
                      ) : (
                        <p className="text-xs italic text-muted-foreground/70">
                          {latestActivity
                            ? "Ingen progresjonsanalyse for siste aktivitet ennå."
                            : "Ingen aktiviteter å analysere."}
                        </p>
                      )}
                      {latestActivity && (
                        <p className="text-[10px] text-muted-foreground/60">
                          Siste: {latestActivity.navn ?? latestActivity.type ?? "Aktivitet"}
                          {" · "}
                          {formatDate(latestActivity.dato)}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Forslag til neste aktivitet */}
                {forslag && (
                  <div className="flex gap-3 px-4 py-3.5 border-b border-border/60 bg-primary/5">
                    <Lightbulb className="h-4 w-4 text-primary/70 shrink-0 mt-0.5" />
                    <div className="space-y-0.5">
                      <p className="text-[10px] font-semibold uppercase tracking-widest text-primary/70">
                        Forslag til neste aktivitet
                      </p>
                      <p className="text-sm text-foreground/85 leading-relaxed">{forslag}</p>
                    </div>
                  </div>
                )}

                {/* Table header */}
                <div className="flex items-center gap-3 px-4 py-2 bg-secondary/20 border-b border-border/60 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                  <span className="w-5 shrink-0" />
                  <span className="flex-1">Aktivitet</span>
                  <span className="w-16 text-right shrink-0">Distanse</span>
                  <span className="hidden sm:block w-14 text-right shrink-0">Tid</span>
                  <span className="w-20 text-right shrink-0">Dato</span>
                </div>

                {/* Table rows */}
                <div className="divide-y divide-border/60">
                  {visibleActivities.map((a) => (
                    <button
                      key={a.id}
                      type="button"
                      onClick={() => setSelected(a)}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-secondary/30 transition-colors text-left"
                    >
                      <span className="w-5 shrink-0 text-base leading-none">{activityIcon(a.type)}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-foreground truncate">
                          {a.navn ?? a.type ?? "Aktivitet"}
                        </p>
                        <p className="text-[10px] text-muted-foreground capitalize">{a.type ?? ""}</p>
                      </div>
                      <span className={cn("w-16 text-right text-xs tabular-nums shrink-0", a.distanse_km ? "text-foreground" : "text-muted-foreground")}>
                        {a.distanse_km ? `${Number(a.distanse_km).toFixed(1)} km` : "—"}
                      </span>
                      <span className="hidden sm:block w-14 text-right text-xs tabular-nums text-muted-foreground shrink-0">
                        {a.varighet_sekunder ? formatDuration(a.varighet_sekunder) : "—"}
                      </span>
                      <span className="w-20 text-right text-[10px] text-muted-foreground/70 shrink-0">
                        {formatDate(a.dato)}
                      </span>
                    </button>
                  ))}
                </div>

                {hasMore && (
                  <div className="border-t border-border/60 px-4 py-3">
                    <button
                      type="button"
                      onClick={() => setShowAll((v) => !v)}
                      className="w-full rounded-md border border-border bg-secondary/20 py-2 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/30 hover:text-foreground"
                    >
                      {showAll
                        ? "Vis færre"
                        : `Vis mer (${activities.length - PREVIEW_COUNT} til)`}
                    </button>
                  </div>
                )}

              </CardContent>
            )}
          </Card>
      </div>

    </div>
  );
}
