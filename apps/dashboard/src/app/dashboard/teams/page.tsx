"use client";

import { AppSidebar } from "@app/components/app-sidebar";
import { SiteHeader } from "@app/components/site-header";
import { SidebarInset, SidebarProvider } from "@eq-ex/ui/components/sidebar";
import { OrganizationProtectedRoute } from "@app/components/organization-protected-route";
import { OrganizationAdminRoute } from "@app/components/organization-admin-route";

export default function TeamsPage() {
  return (
    <OrganizationProtectedRoute>
      <OrganizationAdminRoute>
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
                  {/* Teams Header */}
                  <div className="flex items-center justify-between px-4 lg:px-6">
                    <div>
                      <h1 className="text-2xl font-semibold tracking-tight">
                        Team Members
                      </h1>
                      <p className="text-muted-foreground">
                        Manage your organization&apos;s team members and their
                        permissions.
                      </p>
                    </div>
                  </div>

                  {/* Placeholder for Members Table */}
                  <div className="px-4 lg:px-6">
                    <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
                      <div className="p-6">
                        <h3 className="text-lg font-semibold mb-2">
                          Coming Soon
                        </h3>
                        <p className="text-muted-foreground">
                          Team member management will be available here.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </SidebarInset>
        </SidebarProvider>
      </OrganizationAdminRoute>
    </OrganizationProtectedRoute>
  );
}
