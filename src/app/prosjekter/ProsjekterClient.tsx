"use client";

import { useState, useMemo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Tag, Pencil, X, ChevronDown, BrainCircuit } from "lucide-react";
import { toast } from "sonner";

const WEBHOOK_START =
  "https://pia.verlanse.no/webhook/5fc9c8e5-df40-4d2b-ba17-b52a5c0e5924";

// Replace with dedicated webhook URL when PIA review flow is set up in n8n
const WEBHOOK_ASK_PIA =
  "https://pia.verlanse.no/webhook/5fc9c8e5-df40-4d2b-ba17-b52a5c0e5924";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface MasterplanRow {
  id: number;
  fase: string | null;
  oppgave: string | null;
  status: string | null;
  kategori: string | null;
  prioritet: string | null;
  prosjektplan: string | null;
  ai_utkast: string | null;
  pia_kritikk: string | null;
}

type MappedStatus = "aktiv" | "pause" | "idé" | "fullført" | "visjon";

interface MappedProject extends MasterplanRow {
  mappedStatus: MappedStatus;
}

// ── Status mapping ─────────────────────────────────────────────────────────────

function mapStatus(raw: string | null): MappedStatus {
  switch (raw?.toLowerCase().trim()) {
    case "ferdig":   return "fullført";
    case "i gang":   return "aktiv";
    case "planlagt": return "idé";
    case "visjon":
    case "endgame":  return "visjon";
    default:         return "pause";
  }
}

// ── Visual config ──────────────────────────────────────────────────────────────

const statusConfig: Record<
  MappedStatus,
  { label: string; dot: string; badge: string; cardBg: string }
> = {
  aktiv:    { label: "Aktiv",    dot: "bg-emerald-400", badge: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30", cardBg: "bg-blue-900/20" },
  fullført: { label: "Fullført", dot: "bg-blue-400",    badge: "bg-blue-500/15 text-blue-400 border-blue-500/30",         cardBg: "bg-green-900/20" },
  idé:      { label: "Idé",      dot: "bg-purple-400",  badge: "bg-purple-500/15 text-purple-400 border-purple-500/30",   cardBg: "bg-purple-900/20" },
  pause:    { label: "Pause",    dot: "bg-yellow-400",  badge: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",   cardBg: "bg-yellow-900/20" },
  visjon:   { label: "Visjon",   dot: "bg-yellow-400",  badge: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",   cardBg: "bg-yellow-900/20" },
};

const DB_STATUSES = ["I gang", "Planlagt", "Ferdig", "På vent", "Visjon", "Endgame"];

// ── Edit Modal ────────────────────────────────────────────────────────────────

function EditModal({
  project,
  onClose,
  onSaved,
}: {
  project: MasterplanRow;
  onClose: () => void;
  onSaved: (updated: MasterplanRow) => void;
}) {
  const [oppgave, setOppgave]           = useState(project.oppgave ?? "");
  const [kategori, setKategori]         = useState(project.kategori ?? "");
  const [status, setStatus]             = useState(project.status ?? "");
  const [fase, setFase]                 = useState(project.fase ?? "");
  const [prosjektplan, setProsjektplan] = useState(project.prosjektplan ?? "");
  const [saving, setSaving]             = useState(false);
  const [askingPia, setAskingPia]       = useState(false);
  const [aiLogOpen, setAiLogOpen]       = useState(false);
  const [error, setError]               = useState<string | null>(null);

  const hasAiContent = !!(project.ai_utkast || project.pia_kritikk);

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/masterplan/${project.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ oppgave, kategori, status, fase, prosjektplan }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Noe gikk galt");
      }
      const updated: MasterplanRow = await res.json();
      onSaved(updated);
      toast.success("Oppgave lagret");
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ukjent feil");
    } finally {
      setSaving(false);
    }
  }

  async function handleAskPia() {
    setAskingPia(true);
    setError(null);
    try {
      const res = await fetch(WEBHOOK_ASK_PIA, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: project.id, prosjektplan }),
      });
      if (!res.ok) throw new Error(`Webhook svarte ${res.status}`);
      toast.success("PIA er varslet", {
        description: "Revurdering er sendt til The Night Shift.",
      });
    } catch (e) {
      toast.error("Webhook feilet", {
        description: e instanceof Error ? e.message : "Ukjent feil",
      });
    } finally {
      setAskingPia(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* Panel — wider to accommodate prosjektplan */}
      <div className="w-full sm:max-w-2xl rounded-xl border border-border bg-card shadow-2xl flex flex-col max-h-[90dvh]">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
          <h2 className="text-sm font-semibold text-foreground">Rediger oppgave</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto px-5 py-4 space-y-4 flex-1">

          {/* Top row: oppgave + fase + status */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-1">
              <Field label="Fase">
                <input
                  type="text"
                  value={fase}
                  onChange={(e) => setFase(e.target.value)}
                  placeholder="f.eks. 1. Infrastruktur"
                  className={inputCls}
                />
              </Field>
            </div>
            <div className="sm:col-span-1">
              <Field label="Status">
                <select value={status} onChange={(e) => setStatus(e.target.value)} className={inputCls}>
                  {DB_STATUSES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </Field>
            </div>
            <div className="sm:col-span-1">
              <Field label="Prioritet">
                <input
                  type="text"
                  value={project.prioritet ?? ""}
                  readOnly
                  className={cn(inputCls, "opacity-50 cursor-not-allowed")}
                />
              </Field>
            </div>
          </div>

          <Field label="Heading (oppgave)">
            <input
              type="text"
              value={oppgave}
              onChange={(e) => setOppgave(e.target.value)}
              className={inputCls}
            />
          </Field>

          <Field label="Beskrivelse (kategori)">
            <textarea
              rows={2}
              value={kategori}
              onChange={(e) => setKategori(e.target.value)}
              className={cn(inputCls, "resize-none")}
            />
          </Field>

          {/* Prosjektplan — main editable area */}
          <Field label="Prosjektplan">
            <textarea
              rows={8}
              value={prosjektplan}
              onChange={(e) => setProsjektplan(e.target.value)}
              placeholder="Skriv eller rediger prosjektplanen her…"
              className={cn(inputCls, "resize-y font-mono text-xs leading-relaxed")}
            />
          </Field>

          {/* AI Logg accordion */}
          {hasAiContent && (
            <div className="rounded-lg border border-border overflow-hidden">
              <button
                type="button"
                onClick={() => setAiLogOpen((o) => !o)}
                className="flex w-full items-center justify-between px-4 py-3 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/30 transition-colors"
              >
                <span className="flex items-center gap-2">
                  <BrainCircuit className="h-3.5 w-3.5 text-primary" />
                  AI Logg
                </span>
                <ChevronDown
                  className={cn("h-3.5 w-3.5 transition-transform", aiLogOpen && "rotate-180")}
                />
              </button>

              {aiLogOpen && (
                <div className="border-t border-border divide-y divide-border">
                  {project.ai_utkast && (
                    <div className="px-4 py-3 space-y-1">
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-primary/70">
                        AI Utkast
                      </p>
                      <pre className="whitespace-pre-wrap text-xs text-foreground/70 font-mono leading-relaxed">
                        {project.ai_utkast}
                      </pre>
                    </div>
                  )}
                  {project.pia_kritikk && (
                    <div className="px-4 py-3 space-y-1">
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-yellow-400/70">
                        PIA Kritikk
                      </p>
                      <pre className="whitespace-pre-wrap text-xs text-foreground/70 font-mono leading-relaxed">
                        {project.pia_kritikk}
                      </pre>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {error && <p className="text-xs text-red-400">{error}</p>}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 px-5 py-4 border-t border-border shrink-0">
          {/* Ask PIA */}
          <button
            type="button"
            onClick={handleAskPia}
            disabled={askingPia || !prosjektplan.trim()}
            className="flex items-center gap-2 rounded-md border border-emerald-500/40 bg-emerald-500/10 px-4 py-2 text-xs font-semibold text-emerald-300 hover:bg-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <BrainCircuit className="h-3.5 w-3.5" />
            {askingPia ? "Sender til PIA…" : "🧠 Ask PIA / Revurder"}
          </button>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="rounded-md border border-border bg-transparent px-4 py-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Avbryt
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="rounded-md bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              {saving ? "Lagrer…" : "Lagre"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const inputCls =
  "w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-muted-foreground">{label}</label>
      {children}
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export function ProsjekterClient({ rows: initialRows }: { rows: MasterplanRow[] }) {
  const [rows, setRows]           = useState<MasterplanRow[]>(initialRows);
  const [faseFilter, setFase]     = useState<string>("alle");
  const [statusFilter, setStatus] = useState<string>("alle");
  const [editing, setEditing]     = useState<MasterplanRow | null>(null);
  const [startingIds, setStartingIds] = useState<Set<number>>(new Set());

  async function handleStartProject(p: MappedProject) {
    setStartingIds((prev) => new Set(prev).add(p.id));

    try {
      // 1. Update status in DB
      const patchRes = await fetch(`/api/masterplan/${p.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "I gang" }),
      });
      if (!patchRes.ok) throw new Error("Kunne ikke oppdatere status");
      const updated: MasterplanRow = await patchRes.json();

      // Optimistic UI update
      setRows((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));

      // 2. Trigger n8n webhook (fire-and-forget — don't block on failure)
      fetch(WEBHOOK_START, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: p.id,
          oppgave: p.oppgave,
          fase: p.fase,
          kategori: p.kategori,
        }),
      }).catch(() => {
        // webhook failure is non-critical
      });

      toast.success(`Prosjekt startet: ${p.oppgave ?? p.id}`, {
        description: "Status satt til «I gang» og The Night Shift er varslet.",
      });
    } catch (err) {
      toast.error("Kunne ikke starte prosjektet", {
        description: err instanceof Error ? err.message : "Ukjent feil",
      });
    } finally {
      setStartingIds((prev) => {
        const next = new Set(prev);
        next.delete(p.id);
        return next;
      });
    }
  }

  const uniqueFaser = useMemo(
    () => Array.from(new Set(rows.map((r) => r.fase).filter(Boolean))).sort() as string[],
    [rows]
  );

  const projects = useMemo<MappedProject[]>(
    () => rows.map((r) => ({ ...r, mappedStatus: mapStatus(r.status) })),
    [rows]
  );

  const visible = useMemo(() => {
    return projects.filter((p) => {
      const faseOk   = faseFilter === "alle" || p.fase === faseFilter;
      const statusOk = statusFilter === "alle" || p.mappedStatus === statusFilter || (statusFilter === "pause" && p.mappedStatus === "visjon");
      return faseOk && statusOk;
    });
  }, [projects, faseFilter, statusFilter]);

  function handleSaved(updated: MasterplanRow) {
    setRows((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
  }

  return (
    <>
      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-8">
        {/* Fase dropdown */}
        <select
          value={faseFilter}
          onChange={(e) => setFase(e.target.value)}
          className={cn(selectCls, "min-w-[180px]")}
        >
          <option value="alle">Alle faser</option>
          {uniqueFaser.map((f) => (
            <option key={f} value={f}>{f}</option>
          ))}
        </select>

        {/* Status dropdown */}
        <select
          value={statusFilter}
          onChange={(e) => setStatus(e.target.value)}
          className={cn(selectCls, "min-w-[160px]")}
        >
          <option value="alle">Alle statuser</option>
          {(["aktiv", "pause", "idé", "fullført"] as MappedStatus[]).map((s) => (
            <option key={s} value={s}>{statusConfig[s].label}</option>
          ))}
        </select>

        <span className="self-center text-xs text-muted-foreground">
          {visible.length} av {rows.length} oppgaver
        </span>
      </div>

      {/* Cards grid */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {visible.map((p) => {
          const cfg = statusConfig[p.mappedStatus];
          return (
            <Card
              key={p.id}
              className={cn(
                "border-border flex flex-col hover:border-primary/30 transition-colors relative",
                cfg.cardBg
              )}
            >
              {/* Edit button */}
              <button
                onClick={() => setEditing(p)}
                className="absolute top-3 right-3 p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-white/10 transition-colors"
                title="Rediger"
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>

              <CardHeader className="pb-2 pr-9">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-sm font-semibold text-foreground leading-snug">
                    {p.oppgave ?? "—"}
                  </CardTitle>
                  <Badge
                    variant="outline"
                    className={cn("shrink-0 text-[10px] border", cfg.badge)}
                  >
                    {cfg.label}
                  </Badge>
                </div>
                {p.kategori && (
                  <CardDescription className="text-xs mt-1">
                    {p.kategori}
                  </CardDescription>
                )}
              </CardHeader>

              <CardContent className="flex-1 flex flex-col justify-between gap-4">
                {/* Fase tag */}
                {p.fase && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Tag className="h-3.5 w-3.5 shrink-0" />
                    <span>{p.fase}</span>
                  </div>
                )}

                {/* Action button */}
                {p.mappedStatus === "idé" && (
                  <button
                    onClick={() => handleStartProject(p)}
                    disabled={startingIds.has(p.id)}
                    className="w-full rounded-md border border-purple-500/40 bg-purple-500/10 px-3 py-2 text-xs font-semibold text-purple-300 hover:bg-purple-500/20 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                  >
                    {startingIds.has(p.id) ? "Starter The Night Shift…" : "🚀 START PROSJEKT"}
                  </button>
                )}
                {p.mappedStatus === "aktiv" && (
                  <button
                    onClick={() => console.log("ASK PIA:", p.oppgave, p.id)}
                    className="w-full rounded-md border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-xs font-semibold text-emerald-300 hover:bg-emerald-500/20 transition-colors"
                  >
                    🧠 ASK PIA
                  </button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {visible.length === 0 && (
        <p className="text-center text-sm text-muted-foreground py-12">
          Ingen oppgaver matcher valgt filter.
        </p>
      )}

      {/* Edit modal */}
      {editing && (
        <EditModal
          project={editing}
          onClose={() => setEditing(null)}
          onSaved={handleSaved}
        />
      )}
    </>
  );
}

const selectCls =
  "rounded-md border border-border bg-card px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 cursor-pointer";
