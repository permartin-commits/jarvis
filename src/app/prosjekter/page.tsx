import { Sidebar } from "@/components/sidebar";
import { mockProjects, type ProjectStatus } from "@/lib/mock-data";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { CalendarDays, Layers } from "lucide-react";

const statusColor: Record<ProjectStatus, string> = {
  aktiv: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  pause: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
  fullført: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  idé: "bg-purple-500/15 text-purple-400 border-purple-500/30",
};

const statusGroups: ProjectStatus[] = ["aktiv", "pause", "idé", "fullført"];

export default function ProsjekterPage() {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto bg-background">
        <div className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur-sm px-8 py-4">
          <h1 className="text-lg font-semibold text-foreground">Prosjekter</h1>
          <p className="text-xs text-muted-foreground">
            Personlige og profesjonelle prosjekter — mock-data
          </p>
        </div>

        <div className="px-8 py-6 space-y-8">
          {/* Stats row */}
          <div className="flex gap-4 flex-wrap">
            {statusGroups.map((status) => {
              const count = mockProjects.filter((p) => p.status === status).length;
              return (
                <div
                  key={status}
                  className="flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2.5"
                >
                  <span
                    className={cn(
                      "h-2 w-2 rounded-full",
                      status === "aktiv"
                        ? "bg-emerald-400"
                        : status === "pause"
                        ? "bg-yellow-400"
                        : status === "fullført"
                        ? "bg-blue-400"
                        : "bg-purple-400"
                    )}
                  />
                  <span className="text-xs capitalize text-muted-foreground">
                    {status}
                  </span>
                  <span className="text-sm font-bold text-foreground">{count}</span>
                </div>
              );
            })}
          </div>

          {/* Project cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {mockProjects.map((p) => (
              <Card
                key={p.id}
                className="bg-card border-border flex flex-col hover:border-primary/30 transition-colors"
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-sm font-semibold text-foreground leading-snug">
                      {p.name}
                    </CardTitle>
                    <Badge
                      variant="outline"
                      className={cn(
                        "shrink-0 text-[10px] border",
                        statusColor[p.status]
                      )}
                    >
                      {p.status}
                    </Badge>
                  </div>
                  <CardDescription className="text-xs mt-1">
                    {p.description}
                  </CardDescription>
                </CardHeader>

                <CardContent className="flex-1 space-y-4">
                  {/* Progress */}
                  <div>
                    <div className="flex justify-between mb-1.5 text-xs">
                      <span className="text-muted-foreground">Fremgang</span>
                      <span className="font-medium text-foreground">
                        {p.progress}%
                      </span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-border">
                      <div
                        className={cn(
                          "h-1.5 rounded-full transition-all",
                          p.status === "fullført"
                            ? "bg-blue-500"
                            : p.status === "aktiv"
                            ? "bg-primary"
                            : p.status === "pause"
                            ? "bg-yellow-500"
                            : "bg-purple-500"
                        )}
                        style={{ width: `${p.progress}%` }}
                      />
                    </div>
                  </div>

                  {/* Stack */}
                  <div className="flex items-start gap-2">
                    <Layers className="h-3.5 w-3.5 mt-0.5 shrink-0 text-muted-foreground" />
                    <div className="flex flex-wrap gap-1">
                      {p.stack.map((tech) => (
                        <Badge
                          key={tech}
                          variant="secondary"
                          className="text-[10px] px-1.5 py-0"
                        >
                          {tech}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Date */}
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <CalendarDays className="h-3.5 w-3.5 shrink-0" />
                    Sist oppdatert {p.updatedAt}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
