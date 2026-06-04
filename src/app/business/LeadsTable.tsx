"use client";

import { useEffect, useState, useCallback } from "react";
import { Copy, ChevronDown, Loader2, RefreshCw, Mail } from "lucide-react";
import { cn } from "@/lib/utils";
import type { LeadRow } from "@/app/api/business/leads/route";

const STATUS_OPTIONS = ["alle", "new", "contacted", "qualified", "won", "lost"] as const;
const INTEREST_OPTIONS = ["alle", "Rådgivning", "Utvikling", "Kurs", "Generell"] as const;

const STATUS_STYLES: Record<string, string> = {
  new:       "bg-cyan-500/15   text-cyan-300   border-cyan-500/30",
  contacted: "bg-violet-500/15 text-violet-300 border-violet-500/30",
  qualified: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  won:       "bg-green-500/20  text-green-300  border-green-500/40",
  lost:      "bg-zinc-700/40   text-zinc-500   border-zinc-600/40",
};

const INTEREST_STYLES: Record<string, string> = {
  Rådgivning: "bg-cyan-500/15   text-cyan-300   border-cyan-500/30",
  Utvikling:  "bg-violet-500/15 text-violet-300 border-violet-500/30",
  Kurs:       "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  Generell:   "bg-zinc-700/40   text-zinc-400   border-zinc-600/40",
};

const STATUS_LABEL: Record<string, string> = {
  new:       "Ny",
  contacted: "Kontaktet",
  qualified: "Kvalifisert",
  won:       "Vunnet",
  lost:      "Tapt",
};

function canonicalStatus(status: string): string {
  const s = status.toLowerCase();
  if (s === "ny") return "new";
  if (s === "kontaktet") return "contacted";
  if (s === "kvalifisert") return "qualified";
  if (s === "vunnet") return "won";
  if (s === "tapt") return "lost";
  return s;
}

const LEADS_GRID =
  "grid grid-cols-[96px_112px_minmax(140px,1fr)_88px_minmax(240px,2.5fr)_96px_104px] gap-3";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("nb-NO", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

function Badge({ value, styleMap }: { value: string; styleMap: Record<string, string> }) {
  const cls = styleMap[value] ?? "bg-zinc-700/40 text-zinc-400 border-zinc-600/40";
  return (
    <span className={cn("inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide", cls)}>
      {value}
    </span>
  );
}

function StatusSelect({ lead, onUpdated }: { lead: LeadRow; onUpdated: (id: string, status: string) => void }) {
  const [saving, setSaving] = useState(false);
  const current = canonicalStatus(lead.status);

  async function handleChange(newStatus: string) {
    if (newStatus === current) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/business/leads/${lead.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) onUpdated(lead.id, newStatus);
    } catch { /* silent */ } finally {
      setSaving(false);
    }
  }

  return (
    <div className="relative inline-flex items-center">
      {saving && <Loader2 className="absolute left-1.5 h-3 w-3 animate-spin text-zinc-400" />}
      <select
        value={current}
        onChange={(e) => void handleChange(e.target.value)}
        disabled={saving}
        className={cn(
          "appearance-none rounded-md border px-2 py-1 pr-6 text-[10px] font-semibold uppercase tracking-wide",
          "bg-zinc-900 outline-none cursor-pointer transition-colors hover:bg-zinc-800",
          STATUS_STYLES[current] ?? "text-zinc-400 border-zinc-600"
        )}
      >
        {STATUS_OPTIONS.filter((s) => s !== "alle").map((s) => (
          <option key={s} value={s} className="bg-zinc-900 text-zinc-200 normal-case">
            {STATUS_LABEL[s]}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-1.5 h-3 w-3 text-zinc-500" />
    </div>
  );
}

function ExpandableText({ text, maxLen = 80 }: { text: string; maxLen?: number }) {
  const [expanded, setExpanded] = useState(false);
  if (!text) return <span className="text-zinc-600">—</span>;
  if (text.length <= maxLen) return <span className="text-zinc-400">{text}</span>;
  return (
    <button
      type="button"
      onClick={() => setExpanded((v) => !v)}
      className="text-left text-zinc-400 hover:text-zinc-200"
    >
      {expanded ? text : `${text.slice(0, maxLen)}…`}
      <span className="ml-1 text-violet-400 underline underline-offset-2 text-[10px]">
        {expanded ? "vis mindre" : "les mer"}
      </span>
    </button>
  );
}

export function LeadsTable({ preview }: { preview?: boolean }) {
  const [leads, setLeads]         = useState<LeadRow[]>([]);
  const [loading, setLoading]     = useState(true);
  const [statusFilter, setStatus] = useState("alle");
  const [interestFilter, setInterest] = useState("alle");
  const [copied, setCopied]       = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (statusFilter   !== "alle") params.set("status",   statusFilter);
    if (interestFilter !== "alle") params.set("interest", interestFilter);
    fetch(`/api/business/leads?${params}`)
      .then((r) => r.json())
      .then((d) => setLeads((d.leads as LeadRow[]) ?? []))
      .catch(() => setLeads([]))
      .finally(() => setLoading(false));
  }, [statusFilter, interestFilter]);

  useEffect(() => { load(); }, [load]);

  function handleStatusUpdated(id: string, status: string) {
    setLeads((prev) => prev.map((l) => l.id === id ? { ...l, status } : l));
  }

  async function copyEmail(email: string) {
    await navigator.clipboard.writeText(email).catch(() => {});
    setCopied(email);
    setTimeout(() => setCopied(null), 1500);
  }

  const rows = preview ? leads.slice(0, 5) : leads;

  return (
    <section>
      <div className="mb-3 flex flex-wrap items-center gap-3">
        <h2 className="text-[10px] font-semibold uppercase tracking-widest text-zinc-600">
          Leads {!loading && `(${leads.length})`}
        </h2>
        {!preview && (
          <>
            <select
              value={statusFilter}
              onChange={(e) => setStatus(e.target.value)}
              className="ml-auto rounded-lg border border-zinc-700 bg-zinc-900 px-2.5 py-1.5 text-xs text-zinc-300 outline-none hover:border-zinc-600"
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>{s === "alle" ? "Alle statuser" : STATUS_LABEL[s] ?? s}</option>
              ))}
            </select>
            <select
              value={interestFilter}
              onChange={(e) => setInterest(e.target.value)}
              className="rounded-lg border border-zinc-700 bg-zinc-900 px-2.5 py-1.5 text-xs text-zinc-300 outline-none hover:border-zinc-600"
            >
              {INTEREST_OPTIONS.map((i) => (
                <option key={i} value={i}>{i === "alle" ? "Alle interesser" : i}</option>
              ))}
            </select>
            <button
              type="button"
              onClick={load}
              className="rounded-lg border border-zinc-700 bg-zinc-900 p-1.5 text-zinc-500 transition-colors hover:border-zinc-600 hover:text-zinc-300"
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </button>
          </>
        )}
      </div>

      <div className="overflow-hidden rounded-2xl border border-zinc-800">
        {/* Header row */}
        <div className={cn(LEADS_GRID, "border-b border-zinc-800 bg-zinc-900/80 px-4 py-2.5 text-[10px] font-semibold uppercase tracking-widest text-zinc-600")}>
          <span>Dato</span>
          <span>Navn</span>
          <span>E-post</span>
          <span>Interesse</span>
          <span>Beskrivelse</span>
          <span>Status</span>
          <span />
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-2 py-12 text-xs text-zinc-600">
            <Loader2 className="h-4 w-4 animate-spin" />
            Henter leads…
          </div>
        ) : rows.length === 0 ? (
          <p className="py-12 text-center text-xs text-zinc-600">Ingen leads funnet.</p>
        ) : (
          <div className="divide-y divide-zinc-800/60">
            {rows.map((lead) => (
              <div
                key={lead.id}
                className={cn(LEADS_GRID, "items-center px-4 py-3 text-xs transition-colors hover:bg-zinc-900/60")}
              >
                <span className="tabular-nums text-zinc-500">{formatDate(lead.created_at)}</span>

                <div className="min-w-0">
                  <p className="truncate font-medium text-zinc-200">{lead.name}</p>
                  {lead.company && (
                    <p className="truncate text-[10px] text-zinc-600">{lead.company}</p>
                  )}
                </div>

                <div className="flex min-w-0 items-center gap-1">
                  <span className="min-w-0 truncate text-zinc-400">{lead.email}</span>
                  <button
                    type="button"
                    onClick={() => void copyEmail(lead.email)}
                    title="Kopier e-post"
                    className="shrink-0 rounded p-1 text-zinc-600 transition-colors hover:bg-zinc-800 hover:text-zinc-300"
                  >
                    {copied === lead.email ? (
                      <span className="text-[9px] font-bold text-emerald-400">✓</span>
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                  </button>
                </div>

                <div>
                  {lead.interest ? (
                    <Badge value={lead.interest} styleMap={INTEREST_STYLES} />
                  ) : (
                    <span className="text-zinc-600">—</span>
                  )}
                </div>

                <div className="min-w-0">
                  <ExpandableText text={lead.description ?? ""} maxLen={120} />
                </div>

                <StatusSelect lead={lead} onUpdated={handleStatusUpdated} />

                <button
                  type="button"
                  onClick={() => {}}
                  className="inline-flex items-center justify-center gap-1.5 rounded-md border border-violet-500/30 bg-violet-500/10 px-2.5 py-1.5 text-[10px] font-medium text-violet-300 transition-colors hover:bg-violet-500/20"
                >
                  <Mail className="h-3 w-3" />
                  Send e-post
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {preview && leads.length > 5 && (
        <p className="mt-2 text-right text-[10px] text-zinc-600">
          + {leads.length - 5} flere · gå til Leads-fanen for full oversikt
        </p>
      )}
    </section>
  );
}
