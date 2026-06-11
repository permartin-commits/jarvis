import { CalendarAgendaList } from "./CalendarAgendaList";
import type { CalendarEvent } from "@/lib/google-api";
import { fetchCalendarEvents } from "@/lib/google-api";

function WidgetError() {
  return (
    <p className="px-3 py-8 text-center text-xs text-pia-muted">
      Kunne ikke hente data
    </p>
  );
}

export async function CalendarAgendaWidget() {
  let events: CalendarEvent[];

  try {
    events = await fetchCalendarEvents();
  } catch (err) {
    console.error("[CalendarAgendaWidget]", err);
    return <WidgetError />;
  }

  const monthLabel = new Date().toLocaleDateString("nb-NO", {
    month: "long",
    year: "numeric",
    timeZone: "Europe/Oslo",
  });

  return <CalendarAgendaList events={events} monthLabel={monthLabel} />;
}
