"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  BrainCircuit,
  Coins,
  Database,
  Hash,
  Loader2,
  TrendingUp,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface HomeMetrics {
  calls: number;
  tokensFmt: string;
  costNokFmt: string;
  revenueFmt: string;
  avkastningFmt: string;
  avkastningNok: number | null;
  avkastningPct: number | null;
  memoryFmt: string;
}

const CARDS: {
  label: string;
  icon: LucideIcon;
  href: string;
  valueKey: keyof Pick<
    HomeMetrics,
    "calls" | "tokensFmt" | "costNokFmt" | "revenueFmt" | "avkastningFmt" | "memoryFmt"
  >;
  valueClass?: (m: HomeMetrics) => string | undefined;
  compact?: boolean;
}[] = [
  { label: "Agent-kall", icon: BrainCircuit, href: "/agent", valueKey: "calls" },
  { label: "Tokens", icon: Hash, href: "/agent", valueKey: "tokensFmt" },
  { label: "API-kostnad", icon: Coins, href: "/agent", valueKey: "costNokFmt" },
  { label: "Omsetning", icon: Wallet, href: "/business", valueKey: "revenueFmt" },
  {
    label: "Total avkastning",
    icon: TrendingUp,
    href: "/portefolje",
    valueKey: "avkastningFmt",
    compact: true,
    valueClass: (m) =>
      m.avkastningNok != null && m.avkastningNok > 0
        ? "text-emerald-400"
        : m.avkastningNok != null && m.avkastningNok < 0
          ? "text-rose-400"
          : undefined,
  },
  { label: "Minner", icon: Database, href: "/agent", valueKey: "memoryFmt" },
];

export function DashboardMetricsGrid() {
  const [data, setData] = useState<HomeMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/home-metrics", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        if (d.error) {
          setData(null);
          return;
        }
        setData(d as HomeMetrics);
      })
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-10 text-xs text-pia-muted">
        <Loader2 className="h-4 w-4 animate-spin text-pia-coral" />
        Henter metrics…
      </div>
    );
  }

  if (!data) {
    return (
      <p className="py-6 text-center text-xs text-pia-muted">Kunne ikke hente metrics</p>
    );
  }

  return (
    <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6 lg:gap-4">
      {CARDS.map(({ label, icon: Icon, href, valueKey, valueClass, compact }) => {
        const raw = data[valueKey];
        const value = valueKey === "calls" ? String(raw) : (raw as string);

        return (
          <Link
            key={label}
            href={href}
            className="pia-bubble-card flex flex-col items-center justify-center gap-2 px-3 py-5 text-center"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-pia-coral/12 text-pia-coral">
              <Icon className="h-4 w-4" strokeWidth={2} />
            </div>
            <p className="text-[9px] font-medium uppercase tracking-wider text-pia-muted">
              {label}
            </p>
            <p
              className={cn(
                "font-bold tabular-nums leading-tight text-pia-text",
                compact ? "text-[11px]" : "text-sm",
                valueKey === "avkastningFmt" && valueClass?.(data)
              )}
            >
              {value}
            </p>
          </Link>
        );
      })}
    </section>
  );
}
