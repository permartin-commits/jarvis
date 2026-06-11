import { Suspense } from "react";
import { CalendarDays, Loader2, Mail } from "lucide-react";
import { PiaCoreSection } from "@/components/PiaCoreSection";
import { DigitalClock } from "@/components/home/DigitalClock";
import { QuickNavGrid } from "@/components/home/QuickNavGrid";
import { DashboardMetricsGrid } from "@/components/home/DashboardMetricsGrid";
import { DashboardPanel } from "@/components/home/DashboardPanel";
import { GmailInboxWidget } from "@/components/home/GmailInboxWidget";
import { CalendarAgendaWidget } from "@/components/home/CalendarAgendaWidget";

function WidgetFallback() {
  return (
    <div className="flex items-center justify-center gap-2 py-12 text-xs text-pia-muted">
      <Loader2 className="h-4 w-4 animate-spin text-pia-coral" />
      Henter…
    </div>
  );
}

export function OperationDashboard({ greeting }: { greeting: string }) {
  return (
    <main className="min-w-0 flex-1 overflow-y-auto">
      <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 md:px-8 md:py-8">
        {/* ── Top bar: status + clock ── */}
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-pia-muted">
              Operation Dashboard
            </p>
            <h1 className="mt-1 text-2xl font-semibold text-pia-text">Oversikt</h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden items-center gap-2 rounded-full border border-border/80 bg-pia-surface/30 px-3 py-1.5 sm:flex">
              <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
              <span className="text-[11px] font-medium text-pia-muted">PIA online</span>
            </div>
            <DigitalClock />
          </div>
        </header>

        {/* ── Hero: Orbit + chat — ingen boks, smelter inn i bakgrunn ── */}
        <section className="relative py-2 md:py-6">
          <div
            className="pointer-events-none absolute inset-x-0 top-0 h-[min(560px,58vh)] overflow-visible"
            aria-hidden
          >
            <div className="pia-hero-atmosphere absolute inset-0 opacity-90 blur-2xl" />
            <div
              className="absolute left-1/2 top-[36%] h-[min(480px,50vw)] w-[min(680px,95vw)] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-60 blur-[80px]"
              style={{
                background:
                  "radial-gradient(ellipse 50% 50% at 50% 50%, color-mix(in srgb, var(--pia-accent-coral) 16%, transparent), transparent 68%)",
              }}
            />
          </div>
          <div className="relative">
            <PiaCoreSection greeting={greeting} hero dashboard />
          </div>
        </section>

        <QuickNavGrid />

        <DashboardMetricsGrid />

        {/* ── Gmail + Calendar ── */}
        <div className="grid gap-4 lg:grid-cols-2">
          <DashboardPanel
            title="Gmail — Inbox"
            icon={<Mail className="h-4 w-4 text-pia-coral" />}
            className="min-h-[320px]"
          >
            <Suspense fallback={<WidgetFallback />}>
              <GmailInboxWidget />
            </Suspense>
          </DashboardPanel>

          <DashboardPanel
            title="Kalender"
            icon={<CalendarDays className="h-4 w-4 text-pia-coral" />}
            className="min-h-[320px]"
          >
            <Suspense fallback={<WidgetFallback />}>
              <CalendarAgendaWidget />
            </Suspense>
          </DashboardPanel>
        </div>
      </div>
    </main>
  );
}
