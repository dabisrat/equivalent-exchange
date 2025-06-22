import { AppSidebar } from "@app/components/app-sidebar"
import { ChartAreaInteractive } from "@app/components/chart-area-interactive"
import { DataTable } from "@app/components/data-table"
import { SectionCards } from "@app/components/section-cards"
import { SiteHeader } from "@app/components/site-header"
import {
  SidebarInset,
  SidebarProvider,
} from "@eq-ex/ui/components/sidebar"
import { ProtectedRoute } from "@app/components/protected-route"

import data from "./data.json"
import { ChartPieDonut } from "@app/components/chart-pie-donut"
import { ChartBarMixed } from "@app/components/chart-bar-mixed"

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <SidebarProvider
        style={
          {
            "--sidebar-width": "calc(var(--spacing) * 72)",
            "--header-height": "calc(var(--spacing) * 12)",
          } as React.CSSProperties
        }
      >
        <AppSidebar variant="inset" />
        <SidebarInset>
          <SiteHeader />
          <div className="flex flex-1 flex-col">
            <div className="@container/main flex flex-1 flex-col gap-2">
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
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </ProtectedRoute>
  )
} 