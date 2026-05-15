"use client";

import { useState, useEffect } from "react";
import { Activity, X, Zap, Map, Heart, Flame, Mountain, ChevronDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { cn } from "@/lib/utils";

// ── Types ─────────────────────────────────────────────────────────────────────

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
  raw: Record<string, unknown> | null;
  analyse_av_okt: string | null;
  progresjonsanalyse: string | null;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

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
    case "run":          return "🏃";
    case "ride":         return "🚴";
    case "swim":         return "🏊";
    case "hike":         return "🥾";
    case "walk":         return "🚶";
    case "climbinggym":
    case "climbing":     return "🧗";
    case "workout":      return "💪";
    default:             return "⚡";
  }
}

// ── Detail Modal ──────────────────────────────────────────────────────────────

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

function DetailModal({ activity, onClose }: { activity: StravaActivity; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl border border-border bg-card shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 px-5 pt-5 pb-4 border-b border-border">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">{activityIcon(activity.type)}</span>
            <div>
              <p className="text-sm font-semibold text-foreground">
                {activity.navn ?? activity.type ?? "Aktivitet"}
              </p>
              <p className="text-xs text-muted-foreground">
                {formatDate(activity.dato)} · {formatTime(activity.dato)}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1.5 text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Stats grid */}
          <div className="grid grid-cols-2 gap-3">
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

          {/* AI analysis fields */}
          {activity.analyse_av_okt && (
            <div className="rounded-lg border border-primary/20 bg-primary/5 px-4 py-3 space-y-1">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-primary/70">
                Analyse av økt
              </p>
              <p className="text-sm text-foreground/85 leading-relaxed whitespace-pre-wrap">
                {activity.analyse_av_okt}
              </p>
            </div>
          )}

          {activity.progresjonsanalyse && (
            <div className="rounded-lg border border-border/60 bg-secondary/30 px-4 py-3 space-y-1">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                Progresjonsanalyse
              </p>
              <p className="text-sm text-foreground/85 leading-relaxed whitespace-pre-wrap">
                {activity.progresjonsanalyse}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function StravaLog() {
  const [isOpen, setIsOpen]         = useState(false);
  const [activities, setActivities] = useState<StravaActivity[]>([]);
  const [selected, setSelected]     = useState<StravaActivity | null>(null);
  const [loading, setLoading]       = useState(true);

  useEffect(() => {
    fetch("/api/strava-activities")
      .then((r) => r.json())
      .then((d) => setActivities((d.activities as StravaActivity[]) ?? []))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="rounded-xl border border-border overflow-hidden">

      {selected && (
        <DetailModal activity={selected} onClose={() => setSelected(null)} />
      )}

      {/* Collapsible header */}
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-secondary/30 transition-colors"
      >
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-500/10 ring-1 ring-orange-500/20 shrink-0">
          <Activity className="h-4 w-4 text-orange-400" />
        </div>
        <div className="text-left flex-1 min-w-0">
          <h2 className="text-sm font-semibold text-foreground">Strava</h2>
          <p className="text-xs text-muted-foreground">
            {isOpen
              ? "Aktiviteter synkronisert via n8n"
              : loading
              ? "Laster…"
              : `${activities.length} aktiviteter`}
          </p>
        </div>
        <ChevronDown className={cn(
          "h-4 w-4 text-muted-foreground shrink-0 transition-transform duration-200",
          isOpen && "rotate-180"
        )} />
      </button>

      {/* Expandable content */}
      {isOpen && (
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
              <>
                <CardHeader className="pb-2 border-b border-border">
                  <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Siste aktiviteter
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Klikk for detaljer · {activities.length} aktiviteter
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="grid grid-cols-[auto_1fr_auto_auto_auto] gap-x-4 px-4 py-2 bg-secondary/20 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                    <span />
                    <span>Aktivitet</span>
                    <span className="text-right">Distanse</span>
                    <span className="text-right">Tid</span>
                    <span className="text-right">Dato</span>
                  </div>
                  <div className="divide-y divide-border/60">
                    {activities.map((a) => (
                      <button
                        key={a.id}
                        type="button"
                        onClick={() => setSelected(a)}
                        className="w-full grid grid-cols-[auto_1fr_auto_auto_auto] gap-x-4 px-4 py-3 text-left hover:bg-secondary/30 transition-colors"
                      >
                        <span className="text-base self-center">{activityIcon(a.type)}</span>
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-foreground truncate">
                            {a.navn ?? a.type ?? "Aktivitet"}
                          </p>
                          <p className="text-[10px] text-muted-foreground capitalize">{a.type ?? ""}</p>
                        </div>
                        <span className={cn("text-xs tabular-nums self-center", a.distanse_km ? "text-foreground" : "text-muted-foreground")}>
                          {a.distanse_km ? `${Number(a.distanse_km).toFixed(1)} km` : "—"}
                        </span>
                        <span className="text-xs tabular-nums text-muted-foreground self-center">
                          {a.varighet_sekunder ? formatDuration(a.varighet_sekunder) : "—"}
                        </span>
                        <span className="text-[10px] text-muted-foreground/70 self-center text-right">
                          {formatDate(a.dato)}
                        </span>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </>
            )}
          </Card>
        </div>
      )}

    </div>
  );
}
