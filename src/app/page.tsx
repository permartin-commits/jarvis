import { DashboardFrame } from "@/components/DashboardFrame";
import { OperationDashboard } from "@/components/home/OperationDashboard";

export const dynamic = "force-dynamic";

export default function Home() {
  const timeOfDay = (() => {
    const h = parseInt(
      new Intl.DateTimeFormat("nb-NO", {
        timeZone: "Europe/Oslo",
        hour: "numeric",
        hour12: false,
      }).format(new Date()),
      10
    );
    if (h < 6) return "God natt";
    if (h < 12) return "God morgen";
    if (h < 18) return "God dag";
    return "God kveld";
  })();

  return (
    <DashboardFrame>
      <OperationDashboard greeting={timeOfDay} />
    </DashboardFrame>
  );
}
