import { Sidebar } from "@/components/sidebar";
import { query } from "@/lib/db";
import { ProsjekterClient, type MasterplanRow } from "./ProsjekterClient";

async function getMasterplan(): Promise<MasterplanRow[]> {
  const result = await query<MasterplanRow>(
    `SELECT id, fase, oppgave, status, kategori, prioritet, prosjektplan, ai_utkast, pia_kritikk
     FROM masterplan
     ORDER BY id ASC`
  );
  return result.rows;
}

export default async function ProsjekterPage() {
  const rows = await getMasterplan();

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto bg-background pt-14 md:pt-0">
        <div className="px-4 md:px-8 py-4 md:py-6">
          <ProsjekterClient rows={rows} />
        </div>
      </main>
    </div>
  );
}
