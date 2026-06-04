"use client";

import { useEffect, useState } from "react";
import { Users, TrendingUp, CalendarDays, CreditCard, Clock, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Kpis {
  newLeads7d: number;
  openLeads: number;
  upcomingEvents: number;
  paidBookings: number;
  revenuePaid: number;
  pendingCount: number;
  revenuePending: number;
}

function fmtNok(n: number | null | undefined) {
  const v = Number(n ?? 0);
  if (!Number.isFinite(v)) return "0 kr";
  return v.toLocaleString("nb-NO", { minimumFractionDigits: 0, maximumFractionDigits: 0 }) + " kr";
}

function parseKpis(data: unknown): Kpis | null {
  if (!data || typeof data !== "object" || "error" in data) return null;
  const d = data as Record<string, unknown>;
  return {
    newLeads7d:     Number(d.newLeads7d ?? 0),
    openLeads:      Number(d.openLeads ?? 0),
    upcomingEvents: Number(d.upcomingEvents ?? 0),
    paidBookings:   Number(d.paidBookings ?? 0),
    revenuePaid:    Number(d.revenuePaid ?? 0),
    pendingCount:   Number(d.pendingCount ?? 0),
    revenuePending: Number(d.revenuePending ?? 0),
  };
}

interface CardProps {
  icon: typeof Users;
  label: string;
  value: string;
  sub?: string;
  accent?: "violet" | "cyan" | "green" | "amber" | "rose";
  loading?: boolean;
}

const ACCENT_MAP: Record<NonNullable<CardProps["accent"]>, string> = {
  violet: "text-violet-400 bg-violet-500/10 ring-violet-500/20",
  cyan:   "text-cyan-400   bg-cyan-500/10   ring-cyan-500/20",
  green:  "text-emerald-400 bg-emerald-500/10 ring-emerald-500/20",
  amber:  "text-amber-400  bg-amber-500/10  ring-amber-500/20",
  rose:   "text-rose-400   bg-rose-500/10   ring-rose-500/20",
};

function KpiCard({ icon: Icon, label, value, sub, accent = "violet", loading }: CardProps) {
  const accentCls = ACCENT_MAP[accent];
  return (
    <div className="relative overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
      <div className={cn("mb-3 inline-flex h-9 w-9 items-center justify-center rounded-xl ring-1", accentCls)}>
        <Icon className="h-4 w-4" />
      </div>
      <p className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-zinc-500">{label}</p>
      {loading ? (
        <div className="flex items-center gap-2 py-1">
          <Loader2 className="h-4 w-4 animate-spin text-zinc-600" />
        </div>
      ) : (
        <p className="text-2xl font-bold tabular-nums text-zinc-100">{value}</p>
      )}
      {sub && <p className="mt-1 text-[11px] text-zinc-600">{sub}</p>}
    </div>
  );
}

export function KpiCards() {
  const [kpis, setKpis] = useState<Kpis | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/business/kpis")
      .then((r) => r.json())
      .then((d) => setKpis(parseKpis(d)))
      .catch(() => setKpis(null))
      .finally(() => setLoading(false));
  }, []);

  return (
    <section>
      <h2 className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-zinc-600">
        Nøkkeltall
      </h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <KpiCard
          icon={Users}
          label="Nye leads (7d)"
          value={kpis ? String(kpis.newLeads7d) : "—"}
          sub="status: new"
          accent="cyan"
          loading={loading}
        />
        <KpiCard
          icon={Users}
          label="Åpne leads"
          value={kpis ? String(kpis.openLeads) : "—"}
          sub="new · contacted · qualified"
          accent="violet"
          loading={loading}
        />
        <KpiCard
          icon={CalendarDays}
          label="Kommende kurs"
          value={kpis ? String(kpis.upcomingEvents) : "—"}
          sub="publiserte"
          accent="green"
          loading={loading}
        />
        <KpiCard
          icon={CreditCard}
          label="Påmeldte (betalt)"
          value={kpis ? String(kpis.paidBookings) : "—"}
          accent="green"
          loading={loading}
        />
        <KpiCard
          icon={TrendingUp}
          label="Omsetning"
          value={kpis ? fmtNok(kpis.revenuePaid) : "—"}
          sub="betalte bookings"
          accent="cyan"
          loading={loading}
        />
        <KpiCard
          icon={Clock}
          label="Ventende"
          value={kpis ? `${kpis.pendingCount} · ${fmtNok(kpis.revenuePending)}` : "—"}
          sub="payment_status: pending"
          accent="amber"
          loading={loading}
        />
      </div>
    </section>
  );
}
