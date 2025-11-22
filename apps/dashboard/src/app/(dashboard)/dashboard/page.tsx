import { ChartAreaInteractive } from "@app/components/chart-area-interactive";
import { DataTable } from "@app/components/data-table";
import { SectionCards } from "@app/components/section-cards";
import { ChartPieDonut } from "@app/components/chart-pie-donut";
import { ChartBarMixed } from "@app/components/chart-bar-mixed";
import { getUsersOrganizations } from "@app/data-access/queries/organizations";
import { getDashboardAnalytics } from "@app/data-access/queries/analytics";

export default async function DashboardPage() {
  const orgResult = await getUsersOrganizations();
  const activeOrgId =
    orgResult.success && orgResult.data?.activeOrganization?.id;

  if (!activeOrgId) {
    return <div>Please select an organization</div>;
  }

  const analyticsResult = await getDashboardAnalytics(activeOrgId);
  const analytics = analyticsResult.success ? analyticsResult.data : null;

  if (!analytics) {
    return <div>Failed to load analytics</div>;
  }

  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
      <SectionCards kpi={analytics.kpi} />
      <div className="px-4 lg:px-6">
        <ChartAreaInteractive data={analytics.trends} />
      </div>
      <div className="flex flex-col gap-4 px-4 sm:flex-row sm:gap-4 lg:px-6">
        <div className="w-full sm:basis-1/2">
          <ChartPieDonut data={analytics.segments} />
        </div>
        <div className="w-full sm:basis-1/2">
          <ChartBarMixed data={analytics.peakActivity} />
        </div>
      </div>
      <DataTable data={analytics.recentActivity} />
    </div>
  );
}
