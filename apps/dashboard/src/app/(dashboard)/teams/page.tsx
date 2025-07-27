"use client";

import { OrganizationAdminRoute } from "@app/components/organization-admin-route";
import { MembersTable } from "@app/components/members-table";
import { useOrganizationMembers } from "@app/hooks/use-organization-members";

export default function TeamsPage() {
  const { members, loading, error } = useOrganizationMembers();
  return (
    <OrganizationAdminRoute>
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

        {/* Members Table */}
        <div className="px-4 lg:px-6">
          <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-2">Organization Members</h3>
              <p className="text-muted-foreground mb-4">
                View and manage your team members below.
              </p>
              <MembersTable members={members} isLoading={loading} isError={!!error} />
            </div>
          </div>
        </div>
      </div>
    </OrganizationAdminRoute>
  );
}
