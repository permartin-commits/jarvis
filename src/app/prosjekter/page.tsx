import { DashboardFrame } from "@/components/DashboardFrame";
import { query } from "@/lib/db";
import { ProsjekterClient, type MasterplanRow } from "./ProsjekterClient";

export const dynamic = "force-dynamic";

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
    <DashboardFrame>
      <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-pia-bg">
        <ProsjekterClient rows={rows} />
      </main>
    </DashboardFrame>
  );
}
