import { Sidebar } from "@/components/sidebar";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { BrainCircuit, TrendingUp, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { query } from "@/lib/db";
import { AiLogClient, type AiLogRow } from "./AiLogClient";

async function getAiLogs(): Promise<AiLogRow[]> {
  const result = await query<AiLogRow>(
    `SELECT id, ticker, handling, detaljer
     FROM ai_logger
     ORDER BY id DESC`
  );
  return result.rows;
}

export default async function AiLoggerPage() {
  const logs = await getAiLogs();

  const totalCount = logs.length;
  const uniqueTickers = new Set(logs.map((l) => l.ticker).filter(Boolean)).size;
  const actionCounts = logs.reduce<Record<string, number>>((acc, l) => {
    const key = (l.handling ?? "UKJENT").toUpperCase();
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});
  const topAction =
    Object.entries(actionCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "—";

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto bg-background">
        {/* Header */}
        <div className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur-sm px-8 py-4">
          <h1 className="text-lg font-semibold text-foreground">AI Logger</h1>
          <p className="text-xs text-muted-foreground">
            Live data fra <code className="font-mono">ai_logger</code>-tabellen i Supabase
          </p>
        </div>

        <div className="px-8 py-6 space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
            <MiniStat
              icon={<BrainCircuit className="h-4 w-4" />}
              label="Totale loggoppføringer"
              value={String(totalCount)}
            />
            <MiniStat
              icon={<TrendingUp className="h-4 w-4" />}
              label="Unike aksjer"
              value={String(uniqueTickers)}
            />
            <MiniStat
              icon={<AlertTriangle className="h-4 w-4" />}
              label="Vanligste handling"
              value={topAction}
            />
          </div>

          {/* Log table with search */}
          <AiLogClient logs={logs} />
        </div>
      </main>
    </div>
  );
}

function MiniStat({
  icon,
  label,
  value,
  valueClass,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <Card className="bg-card border-border">
      <CardContent className="pt-5 pb-4 px-5">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-medium text-muted-foreground">{label}</p>
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10 text-primary">
            {icon}
          </div>
        </div>
        <p className={cn("text-2xl font-bold", valueClass ?? "text-foreground")}>
          {value}
        </p>
      </CardContent>
    </Card>
  );
}
