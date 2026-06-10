"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Tag, Pencil, X, ChevronDown, BrainCircuit, Plus, LayoutGrid, Table2, Check, ChevronsUpDown, ChevronUp } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { PiaCoreSection } from "@/components/PiaCoreSection";
import {
  ProsjekterStartupRuns,
  dispatchStartupRun,
  dispatchStartupFailed,
} from "./ProsjekterStartupRuns";

const WEBHOOK_START = "/api/prosjekter-webhook";

const WEBHOOK_ASK_PIA = "/api/prosjekter-webhook";

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

function normStatus(raw: string | null): string {
  return (raw ?? "").replace(/\u00a0/g, " ").trim().toLowerCase();
}

function mapStatus(raw: string | null): MappedStatus {
  switch (normStatus(raw)) {
    case "ferdig":   return "fullført";
    case "i gang":   return "aktiv";
    case "planlagt": return "idé";
    case "visjon":
    case "endgame":  return "visjon";
    default:         return "pause";
  }
}

/** Kan startes med «START PROSJekt» — Planlagt (eller annet status som mapper til idé‑visning). */
function canShowStartProsjektButton(statusRaw: string | null): boolean {
  return mapStatus(statusRaw) === "idé";
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

const MASTERPLAN_POLL_MS = 30_000;

const STATUS_FILTER_OPTIONS: MappedStatus[] = [
  "aktiv",
  "pause",
  "idé",
  "fullført",
  "visjon",
];

const DEFAULT_STATUS_FILTERS: Record<MappedStatus, boolean> = {
  aktiv: true,
  pause: true,
  idé: true,
  fullført: true,
  visjon: true,
};

// ── Shared styles ──────────────────────────────────────────────────────────────

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

// ── Edit Modal ────────────────────────────────────────────────────────────────

function EditModal({
  project,
  onClose,
  onSaved,
  onStartProject,
  startingIds,
}: {
  project: MasterplanRow;
  onClose: () => void;
  onSaved: (updated: MasterplanRow) => void;
  onStartProject: (snapshot: MasterplanRow) => Promise<boolean>;
  startingIds: Set<number>;
}) {
  const [oppgave, setOppgave]           = useState(project.oppgave ?? "");
  const [kategori, setKategori]         = useState(project.kategori ?? "");
  const [status, setStatus]             = useState(project.status ?? "");
  const [fase, setFase]                 = useState(project.fase ?? "");
  const [prioritet, setPrioritet]       = useState(project.prioritet ?? "");
  const [prosjektplan, setProsjektplan] = useState(project.prosjektplan ?? "");
  const [saving, setSaving]             = useState(false);
  const [askingPia, setAskingPia]       = useState(false);
  const [aiLogOpen, setAiLogOpen]       = useState(false);
  const [error, setError]               = useState<string | null>(null);

  const hasAiContent = !!(project.ai_utkast || project.pia_kritikk);
  const showStartButton = canShowStartProsjektButton(status);

  function currentSnapshot(): MasterplanRow {
    return {
      ...project,
      oppgave,
      kategori,
      status,
      fase,
      prioritet,
      prosjektplan,
    };
  }

  async function handleStartFromModal() {
    setError(null);
    const ok = await onStartProject(currentSnapshot());
    if (ok) onClose();
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/masterplan/${project.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ oppgave, kategori, status, fase, prioritet, prosjektplan }),
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
      <div className="w-full sm:max-w-2xl rounded-xl border border-border bg-card shadow-2xl flex flex-col max-h-[90dvh]">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
          <h2 className="text-sm font-semibold text-foreground">Rediger oppgave</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="overflow-y-auto px-5 py-4 space-y-4 flex-1">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-1">
              <Field label="Fase">
                <input type="text" value={fase} onChange={(e) => setFase(e.target.value)}
                  placeholder="f.eks. 1. Infrastruktur" className={inputCls} />
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
                <input type="text" value={prioritet} onChange={(e) => setPrioritet(e.target.value)}
                  placeholder="f.eks. Høy" className={inputCls} />
              </Field>
            </div>
          </div>

          <Field label="Heading (oppgave)">
            <input type="text" value={oppgave} onChange={(e) => setOppgave(e.target.value)} className={inputCls} />
          </Field>

          <Field label="Beskrivelse (kategori)">
            <textarea rows={2} value={kategori} onChange={(e) => setKategori(e.target.value)}
              className={cn(inputCls, "resize-none")} />
          </Field>

          <Field label="Prosjektplan">
            <textarea rows={8} value={prosjektplan} onChange={(e) => setProsjektplan(e.target.value)}
              placeholder="Skriv eller rediger prosjektplanen her…"
              className={cn(inputCls, "resize-y font-mono text-xs leading-relaxed")} />
          </Field>

          {hasAiContent && (
            <div className="rounded-lg border border-border overflow-hidden">
              <button type="button" onClick={() => setAiLogOpen((o) => !o)}
                className="flex w-full items-center justify-between px-4 py-3 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/30 transition-colors">
                <span className="flex items-center gap-2">
                  <BrainCircuit className="h-3.5 w-3.5 text-primary" />
                  AI Logg
                </span>
                <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", aiLogOpen && "rotate-180")} />
              </button>
              {aiLogOpen && (
                <div className="border-t border-border divide-y divide-border">
                  {project.ai_utkast && (
                    <div className="px-4 py-3 space-y-1">
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-primary/70">AI Utkast</p>
                      <pre className="whitespace-pre-wrap text-xs text-foreground/70 font-mono leading-relaxed">{project.ai_utkast}</pre>
                    </div>
                  )}
                  {project.pia_kritikk && (
                    <div className="px-4 py-3 space-y-1">
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-yellow-400/70">PIA Kritikk</p>
                      <pre className="whitespace-pre-wrap text-xs text-foreground/70 font-mono leading-relaxed">{project.pia_kritikk}</pre>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {error && <p className="text-xs text-red-400">{error}</p>}
        </div>

        <div className="flex flex-col gap-3 border-t border-border px-5 py-4 sm:flex-row sm:items-center sm:justify-between shrink-0">
          <div className="flex flex-wrap items-center gap-2">
            {showStartButton && (
              <button
                type="button"
                onClick={handleStartFromModal}
                disabled={startingIds.has(project.id)}
                className="flex items-center gap-2 rounded-md border border-purple-500/40 bg-purple-500/10 px-4 py-2 text-xs font-semibold text-purple-300 transition-colors hover:bg-purple-500/20 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {startingIds.has(project.id) ? "Starter The Night Shift…" : "🚀 START PROSJEKT"}
              </button>
            )}
            <button type="button" onClick={handleAskPia} disabled={askingPia || !prosjektplan.trim()}
              className="flex items-center gap-2 rounded-md border border-emerald-500/40 bg-emerald-500/10 px-4 py-2 text-xs font-semibold text-emerald-300 hover:bg-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
              <BrainCircuit className="h-3.5 w-3.5" />
              {askingPia ? "Sender til PIA…" : "🧠 Ask PIA / Revurder"}
            </button>
          </div>
          <div className="flex gap-3 sm:shrink-0">
            <button type="button" onClick={onClose}
              className="rounded-md border border-border bg-transparent px-4 py-2 text-xs text-muted-foreground hover:text-foreground transition-colors">
              Avbryt
            </button>
            <button type="button" onClick={handleSave} disabled={saving}
              className="rounded-md bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors">
              {saving ? "Lagrer…" : "Lagre"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── New Project Modal ─────────────────────────────────────────────────────────

function NewProjectModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (row: MasterplanRow) => void;
}) {
  const [fase, setFase]                 = useState("");
  const [oppgave, setOppgave]           = useState("");
  const [kategori, setKategori]         = useState("");
  const [prosjektplan, setProsjektplan] = useState("");
  const [status, setStatus]             = useState("Planlagt");
  const [saving, setSaving]             = useState(false);
  const [error, setError]               = useState<string | null>(null);

  async function handleCreate() {
    if (!oppgave.trim()) {
      setError("Heading (oppgave) er påkrevd.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/masterplan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fase, oppgave, kategori, prosjektplan, status }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Noe gikk galt");
      }
      const created: MasterplanRow = await res.json();
      onCreated(created);
      toast.success(`Prosjekt opprettet: ${created.oppgave}`);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ukjent feil");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full sm:max-w-xl rounded-xl border border-border bg-card shadow-2xl flex flex-col max-h-[90dvh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/15">
              <Plus className="h-3.5 w-3.5 text-primary" />
            </div>
            <h2 className="text-sm font-semibold text-foreground">Nytt prosjekt</h2>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto px-5 py-4 space-y-4 flex-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Fase">
              <input type="text" value={fase} onChange={(e) => setFase(e.target.value)}
                placeholder="f.eks. 1. Infrastruktur" className={inputCls} />
            </Field>
            <Field label="Status">
              <select value={status} onChange={(e) => setStatus(e.target.value)} className={inputCls}>
                {DB_STATUSES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </Field>
          </div>

          <Field label="Heading *">
            <input type="text" value={oppgave} onChange={(e) => setOppgave(e.target.value)}
              placeholder="Tittel på prosjektet" className={inputCls} />
          </Field>

          <Field label="Beskrivelse">
            <textarea rows={2} value={kategori} onChange={(e) => setKategori(e.target.value)}
              placeholder="Kort beskrivelse eller kategori"
              className={cn(inputCls, "resize-none")} />
          </Field>

          <Field label="Prosjektplan">
            <textarea rows={6} value={prosjektplan} onChange={(e) => setProsjektplan(e.target.value)}
              placeholder="Skriv prosjektplanen her…"
              className={cn(inputCls, "resize-y font-mono text-xs leading-relaxed")} />
          </Field>

          {error && <p className="text-xs text-red-400">{error}</p>}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-border shrink-0">
          <button onClick={onClose}
            className="rounded-md border border-border bg-transparent px-4 py-2 text-xs text-muted-foreground hover:text-foreground transition-colors">
            Avbryt
          </button>
          <button onClick={handleCreate} disabled={saving}
            className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors">
            <Plus className="h-3.5 w-3.5" />
            {saving ? "Oppretter…" : "Opprett prosjekt"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Table row with inline editing ─────────────────────────────────────────────

function TableRow({
  p,
  onSaved,
  onEdit,
}: {
  p: MappedProject;
  onSaved: (updated: MasterplanRow) => void;
  onEdit: (p: MappedProject) => void;
}) {
  const [editing,   setEditing]   = useState(false);
  const [oppgave,   setOppgave]   = useState(p.oppgave   ?? "");
  const [fase,      setFase]      = useState(p.fase      ?? "");
  const [status,    setStatus]    = useState(p.status    ?? "");
  const [kategori,  setKategori]  = useState(p.kategori  ?? "");
  const [saving,    setSaving]    = useState(false);
  // tracks which text fields are expanded beyond 200 chars
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const cfg = statusConfig[p.mappedStatus];

  function toggleExpand(field: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(field)) {
        next.delete(field);
      } else {
        next.add(field);
      }
      return next;
    });
  }

  /** Renders a text value with 200-char truncation + click-to-expand */
  function TruncatedText({ field, value, className }: { field: string; value: string | null; className?: string }) {
    const text = value ?? "—";
    const isLong = text.length > 200;
    const isOpen = expanded.has(field);
    return (
      <span className={cn("break-words whitespace-pre-wrap", className)}>
        {isLong && !isOpen ? (
          <>
            {text.slice(0, 200)}
            <button
              type="button"
              onClick={() => toggleExpand(field)}
              className="ml-1 text-primary/70 hover:text-primary text-[10px] font-semibold"
            >
              … vis mer
            </button>
          </>
        ) : (
          <>
            {text}
            {isLong && isOpen && (
              <button
                type="button"
                onClick={() => toggleExpand(field)}
                className="ml-1 text-primary/70 hover:text-primary text-[10px] font-semibold"
              >
                vis mindre
              </button>
            )}
          </>
        )}
      </span>
    );
  }

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch(`/api/masterplan/${p.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ oppgave, fase, status, kategori }),
      });
      if (!res.ok) throw new Error("Lagring feilet");
      const updated: MasterplanRow = await res.json();
      onSaved(updated);
      toast.success("Lagret");
      setEditing(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Ukjent feil");
    } finally {
      setSaving(false);
    }
  }

  function handleCancel() {
    setOppgave  (p.oppgave   ?? "");
    setFase     (p.fase      ?? "");
    setStatus   (p.status    ?? "");
    setKategori (p.kategori  ?? "");
    setEditing(false);
  }

  const cellCls = "px-3 py-2.5 text-sm align-top";
  const inlineCls =
    "w-full rounded border border-primary/40 bg-background px-2 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50";

  return (
    <tr
      className={cn(
        "border-b border-border/50 transition-colors",
        editing ? "bg-primary/5" : "hover:bg-secondary/20 cursor-pointer"
      )}
      onClick={(e) => {
        if (editing) return;
        const el = (e.target as HTMLElement).closest(
          "button, a, input, select, textarea"
        );
        if (el) return;
        onEdit(p);
      }}
    >
      {/* ID */}
      <td className={cn(cellCls, "text-xs text-muted-foreground w-10 align-middle")}>{p.id}</td>

      {/* Fase */}
      <td className={cn(cellCls, "min-w-0 w-[12%]")}>
        {editing ? (
          <input value={fase} onChange={(e) => setFase(e.target.value)} className={inlineCls} />
        ) : (
          <TruncatedText field="fase" value={p.fase} className="text-sm font-semibold text-foreground" />
        )}
      </td>

      {/* Heading (oppgave) */}
      <td className={cn(cellCls, "min-w-0 w-[22%]")}>
        {editing ? (
          <input value={oppgave} onChange={(e) => setOppgave(e.target.value)} className={inlineCls} />
        ) : (
          <TruncatedText field="oppgave" value={p.oppgave} className="text-sm font-normal text-foreground" />
        )}
      </td>

      {/* Beskrivelse (kategori) */}
      <td className={cn(cellCls, "min-w-0 w-[38%]")}>
        {editing ? (
          <input value={kategori} onChange={(e) => setKategori(e.target.value)} className={inlineCls} />
        ) : (
          <TruncatedText field="kategori" value={p.kategori} className="text-sm text-foreground" />
        )}
      </td>

      {/* Status */}
      <td className={cn(cellCls, "w-[11%] min-w-[6.5rem] align-middle")}>
        {editing ? (
          <select value={status} onChange={(e) => setStatus(e.target.value)} className={inlineCls}>
            {DB_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        ) : (
          <span className={cn("inline-flex items-center gap-1.5 rounded-sm border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide", cfg.badge)}>
            <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", cfg.dot)} />
            {cfg.label}
          </span>
        )}
      </td>

      {/* Actions */}
      <td
        className={cn(cellCls, "w-[5.5rem] shrink-0")}
        onClick={(e) => e.stopPropagation()}
      >
        {editing ? (
          <div className="flex items-center gap-1.5">
            <button onClick={handleSave} disabled={saving}
              className="flex items-center gap-1 rounded border border-emerald-500/40 bg-emerald-500/10 px-2 py-1 text-[10px] font-semibold text-emerald-400 hover:bg-emerald-500/20 disabled:opacity-50 transition-colors">
              <Check className="h-3 w-3" />
              {saving ? "…" : "Lagre"}
            </button>
            <button onClick={handleCancel}
              className="rounded border border-border px-2 py-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors">
              <X className="h-3 w-3" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setEditing(true);
              }}
              className="rounded border border-border px-2 py-1 text-[10px] text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors"
              title="Inline redigering">
              <Pencil className="h-3 w-3" />
            </button>
          </div>
        )}
      </td>
    </tr>
  );
}

type SortKey = "id" | "oppgave" | "fase" | "status" | "kategori";
type SortDir = "asc" | "desc";

function TableView({
  visible,
  onSaved,
  onEdit,
}: {
  visible: MappedProject[];
  onSaved: (updated: MasterplanRow) => void;
  onEdit: (p: MappedProject) => void;
}) {
  const [sortKey, setSortKey] = useState<SortKey>("id");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  const sorted = useMemo(() => {
    return [...visible].sort((a, b) => {
      const av = (a[sortKey] ?? "").toString().toLowerCase();
      const bv = (b[sortKey] ?? "").toString().toLowerCase();
      // numeric sort for id
      if (sortKey === "id") {
        return sortDir === "asc" ? a.id - b.id : b.id - a.id;
      }
      return sortDir === "asc" ? av.localeCompare(bv, "nb") : bv.localeCompare(av, "nb");
    });
  }, [visible, sortKey, sortDir]);

  function SortIcon({ col }: { col: SortKey }) {
    if (sortKey !== col) return <ChevronsUpDown className="h-3 w-3 opacity-30" />;
    return sortDir === "asc"
      ? <ChevronUp className="h-3 w-3 text-primary" />
      : <ChevronDown className="h-3 w-3 text-primary" />;
  }

  const cols: { key: SortKey; label: string }[] = [
    { key: "id",       label: "#" },
    { key: "fase",     label: "Fase" },
    { key: "oppgave",  label: "Heading" },
    { key: "kategori", label: "Beskrivelse" },
    { key: "status",   label: "Status" },
  ];

  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-0 table-fixed border-collapse text-left">
          <colgroup>
            <col className="w-9" />
            <col className="w-[12%]" />
            <col className="w-[22%]" />
            <col className="w-[38%]" />
            <col className="w-[11%]" />
            <col className="w-[5.5rem]" />
          </colgroup>
          <thead>
            <tr className="border-b border-border bg-secondary/30">
              {cols.map(({ key, label }) => (
                <th key={key}
                  onClick={() => handleSort(key)}
                  className="px-3 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground cursor-pointer select-none hover:text-foreground transition-colors"
                >
                  <span className="flex min-w-0 items-center gap-1">
                    {label}
                    <SortIcon col={key} />
                  </span>
                </th>
              ))}
              <th className="px-3 py-2.5 w-[5.5rem]" />
            </tr>
          </thead>
          <tbody>
            {sorted.map((p) => (
              <TableRow key={p.id} p={p} onSaved={onSaved} onEdit={onEdit} />
            ))}
          </tbody>
        </table>
      </div>
      {visible.length === 0 && (
        <p className="py-10 text-center text-sm text-muted-foreground">
          Ingen oppgaver matcher valgt filter.
        </p>
      )}
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export function ProsjekterClient({ rows: initialRows }: { rows: MasterplanRow[] }) {
  const [rows, setRows]           = useState<MasterplanRow[]>(initialRows);
  const [faseFilter, setFase] = useState<string>("alle");
  const [statusFilters, setStatusFilters] =
    useState<Record<MappedStatus, boolean>>(DEFAULT_STATUS_FILTERS);
  const [editing, setEditing]     = useState<MasterplanRow | null>(null);
  const [creating, setCreating]   = useState(false);
  const [startingIds, setStartingIds] = useState<Set<number>>(new Set());
  const [viewMode, setViewMode]   = useState<"cards" | "table">("table");

  const fetchMasterplan = useCallback(async () => {
    try {
      const res = await fetch("/api/masterplan", { cache: "no-store" });
      if (!res.ok) return;
      const data = (await res.json()) as { rows?: MasterplanRow[] };
      if (Array.isArray(data.rows)) setRows(data.rows);
    } catch {
      /* ignore network errors during poll */
    }
  }, []);

  useEffect(() => {
    fetchMasterplan();
    const id = setInterval(fetchMasterplan, MASTERPLAN_POLL_MS);
    return () => clearInterval(id);
  }, [fetchMasterplan]);

  useEffect(() => {
    function onFocus() {
      fetchMasterplan();
    }
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [fetchMasterplan]);

  async function handleStartProject(p: MasterplanRow): Promise<boolean> {
    setStartingIds((prev) => new Set(prev).add(p.id));
    dispatchStartupRun(p.id);
    let success = false;
    try {
      const patchRes = await fetch(`/api/masterplan/${p.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "I gang" }),
      });
      if (!patchRes.ok) throw new Error("Kunne ikke oppdatere status");
      const updated: MasterplanRow = await patchRes.json();
      setRows((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));

      const webhookRes = await fetch(WEBHOOK_START, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: p.id,
          masterplan_id: p.id,
          oppgave: p.oppgave,
          fase: p.fase,
          kategori: p.kategori,
        }),
      });
      if (!webhookRes.ok) {
        throw new Error("Webhook til Master OS feilet");
      }

      toast.success(`Prosjekt startet: ${p.oppgave ?? p.id}`, {
        description: "Status satt til «I gang» og The Night Shift er varslet.",
      });
      success = true;
    } catch (err) {
      dispatchStartupFailed(p.id);
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
    return success;
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
      const faseOk = faseFilter === "alle" || p.fase === faseFilter;
      const statusOk = statusFilters[p.mappedStatus];
      return faseOk && statusOk;
    });
  }, [projects, faseFilter, statusFilters]);

  function handleSaved(updated: MasterplanRow) {
    setRows((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
  }

  function handleCreated(created: MasterplanRow) {
    setRows((prev) => [...prev, created]);
  }

  return (
    <>
      <div className="flex min-h-0 w-full flex-1 overflow-hidden">
        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto">
          {/* Mobile — PIA øverst, som på Fitness */}
          <div className="flex flex-col items-center gap-3 border-b border-border bg-background px-4 py-6 lg:hidden">
            <PiaCoreSection compact embedded />
            <ProsjekterStartupRuns />
          </div>

          <div className="px-4 py-4 md:px-8 md:py-6">
      {/* Toolbar */}
      <div className="mb-8 flex flex-wrap items-center gap-3">
        <select value={faseFilter} onChange={(e) => setFase(e.target.value)}
          className={cn(selectCls, "min-w-[180px]")}>
          <option value="alle">Alle faser</option>
          {uniqueFaser.map((f) => (
            <option key={f} value={f}>{f}</option>
          ))}
        </select>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-md border border-border bg-card px-3 py-2">
          <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            Status
          </span>
          {STATUS_FILTER_OPTIONS.map((s) => (
            <label
              key={s}
              className="flex cursor-pointer items-center gap-1.5 text-xs text-foreground"
            >
              <Checkbox
                checked={statusFilters[s]}
                onCheckedChange={(checked) =>
                  setStatusFilters((prev) => ({
                    ...prev,
                    [s]: checked === true,
                  }))
                }
              />
              <span
                className={cn(
                  "inline-block h-1.5 w-1.5 rounded-full shrink-0",
                  statusConfig[s].dot
                )}
              />
              {statusConfig[s].label}
            </label>
          ))}
        </div>

        <span className="flex-1 self-center text-xs text-muted-foreground">
          {visible.length} av {rows.length} oppgaver
        </span>

        {/* ── View toggle ────────────────────────────────────────────── */}
        <div className="flex items-center rounded-md border border-border overflow-hidden">
          <button
            onClick={() => setViewMode("cards")}
            className={cn(
              "flex items-center gap-1.5 px-3 py-2 text-xs transition-colors",
              viewMode === "cards"
                ? "bg-primary/15 text-primary"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary/40"
            )}
          >
            <LayoutGrid className="h-3.5 w-3.5" />
            Kort
          </button>
          <div className="w-px h-full bg-border" />
          <button
            onClick={() => setViewMode("table")}
            className={cn(
              "flex items-center gap-1.5 px-3 py-2 text-xs transition-colors",
              viewMode === "table"
                ? "bg-primary/15 text-primary"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary/40"
            )}
          >
            <Table2 className="h-3.5 w-3.5" />
            Tabell
          </button>
        </div>

        {/* ── Add New button ─────────────────────────────────────────── */}
        <button
          onClick={() => setCreating(true)}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm"
        >
          <Plus className="h-3.5 w-3.5" />
          Legg til ny
        </button>
      </div>

      {/* Cards / Table view */}
      {viewMode === "cards" ? (
        <>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 2xl:grid-cols-3">
            {visible.map((p) => {
              const cfg = statusConfig[p.mappedStatus];
              return (
                <Card
                  key={p.id}
                  role="button"
                  tabIndex={0}
                  onClick={(e) => {
                    const t = e.target as HTMLElement;
                    if (t.closest("button")) return;
                    setEditing(p);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      const t = e.target as HTMLElement;
                      if (t.closest("button")) return;
                      setEditing(p);
                    }
                  }}
                  className={cn(
                    "relative flex cursor-pointer flex-col border-border outline-none ring-primary/40 transition-colors hover:border-primary/30 focus-visible:ring-2",
                    cfg.cardBg
                  )}
                >
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditing(p);
                    }}
                    className="absolute right-3 top-3 rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-white/10 hover:text-foreground"
                    title="Rediger">
                    <Pencil className="h-3.5 w-3.5" />
                  </button>

                  <CardHeader className="pb-2 pr-9">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-sm font-semibold text-foreground leading-snug">
                        {p.oppgave ?? "—"}
                      </CardTitle>
                      <Badge variant="outline" className={cn("shrink-0 text-[10px] border", cfg.badge)}>
                        {cfg.label}
                      </Badge>
                    </div>
                    {p.kategori && (
                      <CardDescription className="text-xs mt-1">{p.kategori}</CardDescription>
                    )}
                  </CardHeader>

                  <CardContent className="flex flex-1 flex-col justify-between gap-4">
                    {canShowStartProsjektButton(p.status) && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          void handleStartProject(p);
                        }}
                        disabled={startingIds.has(p.id)}
                        className="w-full shrink-0 rounded-md border border-purple-500/40 bg-purple-500/10 px-3 py-2 text-xs font-semibold text-purple-300 transition-colors hover:bg-purple-500/20 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {startingIds.has(p.id) ? "Starter The Night Shift…" : "🚀 START PROSJEKT"}
                      </button>
                    )}
                    {p.fase && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Tag className="h-3.5 w-3.5 shrink-0" />
                        <span>{p.fase}</span>
                      </div>
                    )}
                    {p.mappedStatus === "aktiv" && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditing(p);
                        }}
                        className="w-full rounded-md border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-xs font-semibold text-emerald-300 transition-colors hover:bg-emerald-500/20">
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
        </>
      ) : (
        <TableView
          visible={visible}
          onSaved={handleSaved}
          onEdit={(p) => setEditing(p)}
        />
      )}

          <div className="h-6" />
          </div>
        </div>

        {/* Desktop — PIA høyre kolonne */}
        <div className="hidden w-72 shrink-0 flex-col items-center gap-4 overflow-y-auto border-l border-zinc-800 bg-zinc-950 px-4 py-8 lg:flex xl:w-80">
          <PiaCoreSection compact embedded />
          <ProsjekterStartupRuns />
        </div>
      </div>

      {/* Edit modal */}
      {editing && (
        <EditModal
          project={editing}
          onClose={() => setEditing(null)}
          onSaved={handleSaved}
          onStartProject={handleStartProject}
          startingIds={startingIds}
        />
      )}

      {/* New project modal */}
      {creating && (
        <NewProjectModal onClose={() => setCreating(false)} onCreated={handleCreated} />
      )}
    </>
  );
}

const selectCls =
  "rounded-md border border-border bg-card px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 cursor-pointer";
