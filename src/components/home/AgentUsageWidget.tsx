"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BrainCircuit, Coins, Hash, Loader2, ArrowUpRight } from "lucide-react";

interface UsageData {
  calls: number;
  totalTokens: number;
  costNokFmt: string;
}

export function AgentUsageWidget() {
  const [data, setData] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/pia-usage", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) =>
        setData({
          calls: d.calls ?? 0,
          totalTokens: d.totalTokens ?? 0,
          costNokFmt: d.costNokFmt ?? "—",
        })
      )
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  function formatTokens(n: number) {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
    return String(n);
  }

  return (
    <section className="pia-panel flex h-full flex-col overflow-hidden">
      <div className="pia-panel-header flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <BrainCircuit className="h-4 w-4 text-pia-coral" />
          <h2 className="text-xs font-semibold uppercase tracking-widest text-pia-muted">
            Agent usage
          </h2>
        </div>
        <Link
          href="/agent"
          className="flex items-center gap-0.5 text-[10px] font-medium text-pia-coral hover:text-pia-pink"
        >
          Monitor
          <ArrowUpRight className="h-3 w-3" />
        </Link>
      </div>

      <div className="flex flex-1 flex-col justify-center gap-4 p-4">
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-6 text-xs text-pia-muted">
            <Loader2 className="h-4 w-4 animate-spin text-pia-coral" />
            Henter…
          </div>
        ) : data ? (
          <div className="grid grid-cols-3 gap-3">
            <Stat icon={<BrainCircuit className="h-3.5 w-3.5" />} label="Kall" value={String(data.calls)} />
            <Stat icon={<Hash className="h-3.5 w-3.5" />} label="Tokens" value={formatTokens(data.totalTokens)} />
            <Stat icon={<Coins className="h-3.5 w-3.5" />} label="Kostnad" value={data.costNokFmt} />
          </div>
        ) : (
          <p className="py-4 text-center text-xs text-pia-muted">Ingen usage-data ennå</p>
        )}
      </div>
    </section>
  );
}

function Stat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border border-border/60 bg-pia-bg/50 px-3 py-3 text-center">
      <div className="mb-1.5 flex items-center justify-center gap-1 text-pia-muted">{icon}</div>
      <p className="text-[9px] font-medium uppercase tracking-wider text-pia-muted">{label}</p>
      <p className="mt-0.5 text-lg font-bold tabular-nums text-pia-text">{value}</p>
    </div>
  );
}
