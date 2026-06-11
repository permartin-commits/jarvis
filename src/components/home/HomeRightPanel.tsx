import { Suspense } from "react";
import { CalendarDays, Loader2 } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { WidgetPanel } from "./WidgetSection";
import { GmailInboxWidget } from "./GmailInboxWidget";
import { CalendarAgendaWidget } from "./CalendarAgendaWidget";

function WidgetFallback() {
  return (
    <div className="flex items-center justify-center gap-2 py-10 text-xs text-pia-muted">
      <Loader2 className="h-4 w-4 animate-spin text-pia-coral" />
      Henter…
    </div>
  );
}

/** Desktop right rail — Gmail + Kalender (Business m.fl.) */
export function HomeRightPanel() {
  return (
    <aside className="hidden xl:flex h-screen w-72 shrink-0 flex-col border-l border-border bg-pia-bg">
      <div className="flex h-16 shrink-0 items-center gap-2.5 px-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-pia-coral/15 ring-1 ring-pia-coral/30">
          <CalendarDays className="h-4 w-4 text-pia-coral" strokeWidth={2} />
        </div>
        <div className="flex flex-col leading-none gap-0.5">
          <span className="text-sm font-bold tracking-wide text-pia-text">
            Oversikt
          </span>
          <span className="text-[10px] uppercase tracking-widest text-pia-muted">
            Gmail · Kalender
          </span>
        </div>
      </div>

      <Separator className="opacity-50" />

      <div className="flex-1 overflow-y-auto">
        <WidgetPanel title="▸ GMAIL - INBOX">
          <Suspense fallback={<WidgetFallback />}>
            <GmailInboxWidget />
          </Suspense>
        </WidgetPanel>

        <Separator className="mx-3 opacity-40" />

        <WidgetPanel title="▸ KALENDER - OVERSIKT">
          <Suspense fallback={<WidgetFallback />}>
            <CalendarAgendaWidget />
          </Suspense>
        </WidgetPanel>
      </div>
    </aside>
  );
}

/** Shown below main content on viewports without right rail */
export function HomeWidgetsMobile() {
  return (
    <div className="w-full space-y-6 xl:hidden">
      <WidgetPanel title="▸ GMAIL - INBOX">
        <Suspense fallback={<WidgetFallback />}>
          <GmailInboxWidget />
        </Suspense>
      </WidgetPanel>
      <WidgetPanel title="▸ KALENDER - OVERSIKT">
        <Suspense fallback={<WidgetFallback />}>
          <CalendarAgendaWidget />
        </Suspense>
      </WidgetPanel>
    </div>
  );
}
