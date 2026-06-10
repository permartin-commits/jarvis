"use client";

import { useState } from "react";
import { BarChart2, CalendarDays, Users, Layers } from "lucide-react";
import { cn } from "@/lib/utils";
import { KpiCards } from "./KpiCards";
import { LeadsTable } from "./LeadsTable";
import { BookingsTable } from "./BookingsTable";
import { EventsGrid } from "./EventsGrid";

type Tab = "oversikt" | "leads" | "bookings" | "events";

const TABS: { id: Tab; label: string; icon: typeof Users }[] = [
  { id: "oversikt",  label: "Oversikt",  icon: BarChart2 },
  { id: "leads",     label: "Leads",     icon: Users },
  { id: "bookings",  label: "Bookings",  icon: CalendarDays },
  { id: "events",    label: "Kurs",      icon: Layers },
];

export function BusinessShell() {
  const [tab, setTab] = useState<Tab>("oversikt");

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <header className="shrink-0 border-b border-zinc-800 bg-zinc-950 px-6 py-4">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-lg font-bold tracking-tight text-zinc-100">
              Business
            </h1>
            <p className="text-xs text-zinc-500">
              Verlanse.no · leads, påmeldinger og kurs
            </p>
          </div>

          <nav className="flex gap-1 rounded-xl border border-zinc-800 bg-zinc-900 p-1">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setTab(id)}
                className={cn(
                  "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all",
                  tab === id
                    ? "bg-violet-600/20 text-violet-300 ring-1 ring-violet-500/40"
                    : "text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300"
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-6 py-6">
        {tab === "oversikt" && (
          <div className="space-y-8">
            <KpiCards />
            <BookingsTable preview />
            <LeadsTable preview />
            <EventsGrid preview />
          </div>
        )}
        {tab === "leads"    && <LeadsTable />}
        {tab === "bookings" && <BookingsTable />}
        {tab === "events"   && <EventsGrid />}
        <div className="h-10" />
      </div>
    </div>
  );
}
