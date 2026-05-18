import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { CalendarDays, Home, Users } from "lucide-react";

const statCards = [
  {
    label: "Antall hytter",
    icon: Home,
    hint: "Hytter i Fridel",
  },
  {
    label: "Antall brukere",
    icon: Users,
    hint: "Registrerte brukere",
  },
  {
    label: "Antall bookinger",
    icon: CalendarDays,
    hint: "Bookinger totalt",
  },
] as const;

export function FridelDashboard() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {statCards.map(({ label, icon: Icon, hint }) => (
          <Card key={label} className="border-border bg-card">
            <CardContent className="px-5 pb-5 pt-5">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-xs font-medium text-muted-foreground">{label}</p>
                <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10 text-primary">
                  <Icon className="h-4 w-4" aria-hidden />
                </div>
              </div>
              <p
                className={cn(
                  "flex min-h-[2rem] items-center text-2xl font-bold tabular-nums text-muted-foreground/40"
                )}
                aria-label={`${label}: ikke tilkoblet ennå`}
              >
                —
              </p>
              <p className="mt-1 text-[11px] text-muted-foreground/70">{hint}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <p className="text-xs text-muted-foreground/80">
        Statistikk kobles til Supabase når tabellene er klare.
      </p>
    </div>
  );
}
