import { GmailInboxList } from "./GmailInboxList";
import type { GmailMessage } from "@/lib/google-api";
import { fetchGmailMessages } from "@/lib/google-api";

function WidgetError() {
  return (
    <p className="px-3 py-8 text-center text-xs text-pia-muted">
      Kunne ikke hente data
    </p>
  );
}

export async function GmailInboxWidget() {
  let messages: GmailMessage[];

  try {
    messages = await fetchGmailMessages();
  } catch (err) {
    console.error("[GmailInboxWidget]", err);
    return <WidgetError />;
  }

  if (messages.length === 0) {
    return (
      <p className="px-3 py-8 text-center text-xs text-pia-muted">
        Ingen e-poster i innboksen
      </p>
    );
  }

  return <GmailInboxList messages={messages} />;
}
