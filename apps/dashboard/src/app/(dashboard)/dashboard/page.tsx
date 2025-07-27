import { ChartAreaInteractive } from "@app/components/chart-area-interactive";
import { DataTable } from "@app/components/data-table";
import { SectionCards } from "@app/components/section-cards";
import { ChartPieDonut } from "@app/components/chart-pie-donut";
import { ChartBarMixed } from "@app/components/chart-bar-mixed";

import data from "./data.json";

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
      <SectionCards />
      <div className="px-4 lg:px-6">
        <ChartAreaInteractive />
      </div>
      <div className="flex flex-col gap-4 px-4 sm:flex-row sm:gap-4 lg:px-6">
        <div className="w-full sm:basis-1/2">
          <ChartPieDonut />
        </div>
        <div className="w-full sm:basis-1/2">
          <ChartBarMixed />
        </div>
      </div>
      <DataTable data={data} />
    </div>
  );
}
