"use client";

import { useState, useEffect, useRef } from "react";
import { Timer, StopCircle, Save, X, Weight, MessageSquare, ArrowUpDown, ChevronUp, ChevronDown, Filter } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

// ── Types ─────────────────────────────────────────────────────────────────────

type Phase = "idle" | "countdown" | "running" | "form" | "saving";
type GripCm = 1 | 2 | 3;
type SortCol = "dato" | "cm_grip" | "varighet_sekunder";
type SortDir = "asc" | "desc";
type FilterCm = "all" | GripCm;

interface BeastmakerSession {
  id: number;
  dato: string;
  starttid: string;
  varighet_sekunder: number;
  cm_grip: GripCm;
  med_vekt: boolean;
  ekstravekt_kg: string | null;
  kommentar: string | null;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDuration(s: number): string {
  const abs = Math.abs(s);
  const m = Math.floor(abs / 60);
  const sec = abs % 60;
  const str = `${m}:${sec.toString().padStart(2, "0")}`;
  return s < 0 ? `-${str}` : str;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("nb-NO", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

// ── Component ─────────────────────────────────────────────────────────────────

export function BeastmakerLogger() {
  const [isOpen, setIsOpen] = useState(false);

  // Timer / form state
  const [phase, setPhase]           = useState<Phase>("idle");
  const [elapsed, setElapsed]       = useState(0);
  const [startTime, setStartTime]   = useState<Date | null>(null);
  const [cm, setCm]                 = useState<GripCm | null>(null);
  const [medVekt, setMedVekt]       = useState(false);
  const [ekstravekt, setEkstravekt] = useState("");
  const [kommentar, setKommentar]   = useState("");
  const [saveError, setSaveError]   = useState<string | null>(null);

  // History state
  const [sessions, setSessions]   = useState<BeastmakerSession[]>([]);
  const [sortCol, setSortCol]     = useState<SortCol>("dato");
  const [sortDir, setSortDir]     = useState<SortDir>("desc");
  const [filterCm, setFilterCm]  = useState<FilterCm>("all");

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    fetch("/api/beastmaker")
      .then((r) => r.json())
      .then((d) => setSessions((d.sessions as BeastmakerSession[]) ?? []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (phase === "countdown" || phase === "running") {
      intervalRef.current = setInterval(() => {
        setElapsed((s) => {
          const next = s + 1;
          if (next === 0) setStartTime(new Date());
          if (next >= 0) setPhase("running");
          return next;
        });
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [phase]);

  function handleStart() {
    setElapsed(-2);
    setStartTime(null);
    setPhase("countdown");
  }

  function handleStop() {
    setPhase("form");
  }

  function handleCancel() {
    setCm(null);
    setMedVekt(false);
    setEkstravekt("");
    setKommentar("");
    setElapsed(0);
    setStartTime(null);
    setSaveError(null);
    setPhase("idle");
  }

  async function handleSave() {
    if (!cm || !startTime) return;
    setPhase("saving");
    setSaveError(null);
    try {
      const res = await fetch("/api/beastmaker", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          starttid: startTime.toISOString(),
          varighet_sekunder: Math.max(0, elapsed),
          cm_grip: cm,
          med_vekt: medVekt,
          ekstravekt_kg: medVekt && ekstravekt ? Number(ekstravekt) : null,
          kommentar: kommentar || null,
        }),
      });
      if (!res.ok) throw new Error("Lagring feilet");
      const data = await res.json() as { session: BeastmakerSession };
      setSessions((prev) => [data.session, ...prev]);
      handleCancel();
    } catch {
      setSaveError("Kunne ikke lagre. Prøv igjen.");
      setPhase("form");
    }
  }

  function toggleSort(col: SortCol) {
    if (sortCol === col) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortCol(col);
      setSortDir("desc");
    }
  }

  function cycleFilterCm() {
    setFilterCm((f) => f === "all" ? 1 : f === 1 ? 2 : f === 2 ? 3 : "all");
  }

  const displayed = [...sessions]
    .filter((s) => filterCm === "all" || s.cm_grip === filterCm)
    .sort((a, b) => {
      let cmp = 0;
      if (sortCol === "dato") {
        cmp = new Date(a.starttid).getTime() - new Date(b.starttid).getTime();
      } else if (sortCol === "cm_grip") {
        cmp = a.cm_grip - b.cm_grip;
      } else {
        cmp = a.varighet_sekunder - b.varighet_sekunder;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });

  const isCountdown = phase === "countdown" || (phase === "running" && elapsed < 0);

  function SortIcon({ col }: { col: SortCol }) {
    if (sortCol !== col) return <ArrowUpDown className="h-3 w-3 opacity-30" />;
    return sortDir === "asc"
      ? <ChevronUp className="h-3 w-3 text-primary" />
      : <ChevronDown className="h-3 w-3 text-primary" />;
  }

  return (
    <div className="rounded-xl border border-border overflow-hidden">

      {/* Collapsible header */}
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-secondary/30 transition-colors"
      >
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 ring-1 ring-primary/20 shrink-0">
          <span className="text-sm font-bold text-primary">B</span>
        </div>
        <div className="text-left flex-1 min-w-0">
          <h2 className="text-sm font-semibold text-foreground">Beastmaker</h2>
          <p className="text-xs text-muted-foreground">
            {isOpen ? "Logg klatreøkt · fingerboard timer" : `${sessions.length} økter logget`}
          </p>
        </div>
        {phase === "running" && (
          <span className="text-xs font-mono text-primary animate-pulse tabular-nums mr-1">
            {formatDuration(elapsed)}
          </span>
        )}
        <ChevronDown className={cn("h-4 w-4 text-muted-foreground shrink-0 transition-transform duration-200", isOpen && "rotate-180")} />
      </button>

      {/* Expandable content */}
      {isOpen && (
        <div className="border-t border-border p-4 space-y-4">

          {/* Timer / Form card */}
          <Card className="bg-card border-border">
            <CardContent className="p-5">

              {phase === "idle" && (
                <div className="flex flex-col items-center gap-4 py-4">
                  <div className="text-5xl font-mono font-bold text-foreground/20 tabular-nums">
                    0:00
                  </div>
                  <button
                    onClick={handleStart}
                    className="flex items-center gap-2 rounded-full bg-primary px-8 py-3 text-sm font-semibold text-primary-foreground shadow-lg hover:bg-primary/90 active:scale-95 transition-all"
                  >
                    <Timer className="h-4 w-4" />
                    Start økt
                  </button>
                </div>
              )}

              {(phase === "countdown" || phase === "running") && (
                <div className="flex flex-col items-center gap-4 py-4">
                  <div className={cn(
                    "text-5xl font-mono font-bold tabular-nums transition-colors duration-300",
                    isCountdown ? "text-orange-400 animate-pulse" : "text-primary animate-pulse"
                  )}>
                    {isCountdown ? elapsed : formatDuration(elapsed)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {isCountdown ? "Gjør deg klar…" : "Henger nå…"}
                  </p>
                  <button
                    onClick={handleStop}
                    disabled={isCountdown}
                    className={cn(
                      "flex items-center gap-2 rounded-full border px-8 py-3 text-sm font-semibold active:scale-95 transition-all",
                      isCountdown
                        ? "border-border/30 text-muted-foreground/30 cursor-not-allowed"
                        : "bg-red-500/15 border-red-500/30 text-red-400 hover:bg-red-500/25"
                    )}
                  >
                    <StopCircle className="h-4 w-4" />
                    Stopp
                  </button>
                </div>
              )}

              {(phase === "form" || phase === "saving") && (
                <div className="space-y-5">
                  <div className="flex items-center gap-2.5 rounded-lg bg-primary/8 border border-primary/20 px-4 py-2.5">
                    <Timer className="h-3.5 w-3.5 text-primary/70 shrink-0" />
                    <span className="text-xs text-muted-foreground">Varighet</span>
                    <span className="ml-auto text-sm font-bold text-primary tabular-nums">
                      {formatDuration(Math.max(0, elapsed))}
                    </span>
                  </div>

                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Grep størrelse
                    </p>
                    <div className="flex gap-2">
                      {([1, 2, 3] as GripCm[]).map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setCm(s)}
                          className={cn(
                            "flex-1 rounded-lg border py-2.5 text-sm font-semibold transition-all",
                            cm === s
                              ? "bg-primary text-primary-foreground border-primary shadow-sm"
                              : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"
                          )}
                        >
                          {s} cm
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                      <Weight className="h-3 w-3" />
                      Vekt
                    </p>
                    <div className="flex gap-2">
                      {[false, true].map((val) => (
                        <button
                          key={String(val)}
                          type="button"
                          onClick={() => setMedVekt(val)}
                          className={cn(
                            "flex-1 rounded-lg border py-2.5 text-sm font-semibold transition-all",
                            medVekt === val
                              ? "bg-primary text-primary-foreground border-primary shadow-sm"
                              : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"
                          )}
                        >
                          {val ? "Med vekt" : "Uten vekt"}
                        </button>
                      ))}
                    </div>
                    {medVekt && (
                      <div className="flex items-center gap-2 rounded-lg border border-border bg-secondary/20 px-3 py-2">
                        <input
                          type="number"
                          value={ekstravekt}
                          onChange={(e) => setEkstravekt(e.target.value)}
                          placeholder="0"
                          min="0"
                          step="0.5"
                          className="w-20 bg-transparent text-sm font-semibold text-foreground outline-none tabular-nums"
                        />
                        <span className="text-xs text-muted-foreground">kg ekstra</span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                      <MessageSquare className="h-3 w-3" />
                      Kommentar <span className="normal-case text-muted-foreground/50">(valgfri)</span>
                    </p>
                    <textarea
                      value={kommentar}
                      onChange={(e) => setKommentar(e.target.value)}
                      placeholder="Hvordan gikk det?"
                      rows={2}
                      className="w-full rounded-lg border border-border bg-secondary/20 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/40 outline-none resize-none focus:border-primary/40 transition-colors"
                    />
                  </div>

                  {saveError && <p className="text-xs text-red-400">{saveError}</p>}

                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={handleCancel}
                      disabled={phase === "saving"}
                      className="flex items-center gap-1.5 rounded-lg border border-border px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-all"
                    >
                      <X className="h-3.5 w-3.5" />
                      Avbryt
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={!cm || phase === "saving"}
                      className={cn(
                        "flex flex-1 items-center justify-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold transition-all",
                        !cm
                          ? "bg-primary/20 text-primary/40 cursor-not-allowed"
                          : phase === "saving"
                          ? "bg-primary/50 text-primary-foreground cursor-wait"
                          : "bg-primary text-primary-foreground hover:bg-primary/90 active:scale-[0.98]"
                      )}
                    >
                      <Save className="h-3.5 w-3.5" />
                      {phase === "saving" ? "Lagrer…" : "Lagre økt"}
                    </button>
                  </div>
                </div>
              )}

            </CardContent>
          </Card>

          {/* History table */}
          <Card className="bg-card border-border overflow-hidden">
            <CardHeader className="pb-3 pt-4 px-4 border-b border-border">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Historikk
                </CardTitle>
                <span className="text-xs text-muted-foreground">
                  {displayed.length}{filterCm !== "all" ? ` / ${sessions.length}` : ""} økter
                </span>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              {sessions.length === 0 ? (
                <p className="py-8 text-center text-xs text-muted-foreground">
                  Ingen økter registrert ennå.
                </p>
              ) : (
                <>
                  <div className="grid grid-cols-[1fr_auto_auto_auto] px-4 py-2 bg-secondary/20 border-b border-border/60 text-[10px] font-medium uppercase tracking-wider text-muted-foreground gap-x-4">
                    <button
                      type="button"
                      onClick={() => toggleSort("dato")}
                      className="flex items-center gap-1 hover:text-foreground transition-colors text-left"
                    >
                      Dato <SortIcon col="dato" />
                    </button>
                    <button
                      type="button"
                      onClick={cycleFilterCm}
                      className={cn(
                        "flex items-center gap-1 hover:text-foreground transition-colors",
                        filterCm !== "all" && "text-primary"
                      )}
                      title="Klikk for å filtrere på grep"
                    >
                      <Filter className="h-3 w-3" />
                      {filterCm === "all" ? "Grep" : `${filterCm} cm`}
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleSort("varighet_sekunder")}
                      className="flex items-center gap-1 hover:text-foreground transition-colors"
                    >
                      Tid <SortIcon col="varighet_sekunder" />
                    </button>
                    <span className="text-right">Vekt</span>
                  </div>

                  <div className="divide-y divide-border/60">
                    {displayed.map((s) => (
                      <div key={s.id} className="px-4 py-3 hover:bg-secondary/20 transition-colors">
                        <div className="grid grid-cols-[1fr_auto_auto_auto] gap-x-4 items-baseline">
                          <span className="text-xs font-medium text-foreground">
                            {formatDate(s.starttid)}
                          </span>
                          <span className={cn(
                            "text-xs font-semibold tabular-nums",
                            s.cm_grip === 1 ? "text-emerald-400" :
                            s.cm_grip === 2 ? "text-yellow-400" : "text-orange-400"
                          )}>
                            {s.cm_grip} cm
                          </span>
                          <span className="text-xs tabular-nums text-foreground">
                            {formatDuration(s.varighet_sekunder)}
                          </span>
                          <span className="text-xs tabular-nums text-muted-foreground text-right min-w-[52px]">
                            {s.med_vekt
                              ? s.ekstravekt_kg ? `+${s.ekstravekt_kg} kg` : "Ja"
                              : "—"}
                          </span>
                        </div>
                        {s.kommentar && (
                          <p className="mt-1 text-[11px] text-muted-foreground/70 leading-snug">
                            {s.kommentar}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>

        </div>
      )}

    </div>
  );
}
