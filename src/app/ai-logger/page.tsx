import { Sidebar } from "@/components/sidebar";
import { mockAiLogs, type LogLevel } from "@/lib/mock-data";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { BrainCircuit, Clock, Zap, Hash } from "lucide-react";

const levelColor: Record<LogLevel, string> = {
  success: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  info: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  warning: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
  error: "bg-red-500/15 text-red-400 border-red-500/30",
};

export default function AiLoggerPage() {
  const totalTokens = mockAiLogs.reduce(
    (sum, l) => sum + l.tokensIn + l.tokensOut,
    0
  );
  const avgDuration =
    mockAiLogs.reduce((sum, l) => sum + l.durationMs, 0) / mockAiLogs.length;
  const errorCount = mockAiLogs.filter((l) => l.level === "error").length;

  const allTags = Array.from(
    new Set(mockAiLogs.flatMap((l) => l.tags))
  ).sort();

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto bg-background">
        <div className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur-sm px-8 py-4">
          <h1 className="text-lg font-semibold text-foreground">AI Logger</h1>
          <p className="text-xs text-muted-foreground">
            Logg over alle forespørsler til AI-modeller — mock-data
          </p>
        </div>

        <div className="px-8 py-6 space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <MiniStat
              icon={<BrainCircuit className="h-4 w-4" />}
              label="Totale kall"
              value={String(mockAiLogs.length)}
            />
            <MiniStat
              icon={<Hash className="h-4 w-4" />}
              label="Totale tokens"
              value={totalTokens.toLocaleString("nb-NO")}
            />
            <MiniStat
              icon={<Clock className="h-4 w-4" />}
              label="Gj.snitt tid"
              value={`${(avgDuration / 1000).toFixed(1)}s`}
            />
            <MiniStat
              icon={<Zap className="h-4 w-4" />}
              label="Feil"
              value={String(errorCount)}
              valueClass={errorCount > 0 ? "text-red-400" : "text-foreground"}
            />
          </div>

          {/* Tag cloud */}
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Tags</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {allTags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Log entries */}
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">
                Alle loggoppføringer
              </CardTitle>
              <CardDescription className="text-xs">
                Nyeste øverst
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border">
                {mockAiLogs.map((log) => (
                  <div key={log.id} className="px-6 py-4 hover:bg-secondary/30 transition-colors">
                    <div className="flex items-start gap-3">
                      {/* Level badge */}
                      <Badge
                        variant="outline"
                        className={cn(
                          "shrink-0 mt-0.5 text-[10px] border",
                          levelColor[log.level]
                        )}
                      >
                        {log.level}
                      </Badge>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-foreground line-clamp-2">
                          {log.prompt}
                        </p>
                        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                          <span className="font-medium text-primary/80">
                            {log.model}
                          </span>
                          <span>{log.tokensIn} in / {log.tokensOut} out tokens</span>
                          <span>{log.durationMs}ms</span>
                          <span>
                            {new Date(log.timestamp).toLocaleString("nb-NO", {
                              day: "2-digit",
                              month: "short",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                        {log.tags.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {log.tags.map((tag) => (
                              <Badge
                                key={tag}
                                variant="secondary"
                                className="text-[10px] px-1.5 py-0"
                              >
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
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
