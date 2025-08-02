"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@app/hooks/use-auth";
import { useMultiOrgContext } from "@app/contexts/multi-org-context";

interface OrganizationAdminRouteProps {
  children: React.ReactNode;
  requiredRoles?: ("owner" | "admin")[];
}

export function OrganizationAdminRoute({
  children,
  requiredRoles = ["owner", "admin"],
}: OrganizationAdminRouteProps) {
  const { user, loading: authLoading } = useAuth();
  const { activeOrganization, loading: orgLoading } = useMultiOrgContext();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    async function checkUserRole() {
      if (authLoading || orgLoading) return;

      if (!user) {
        router.push("/login");
        return;
      }
      if (!activeOrganization) {
        router.push("/");
        return;
      }

      try {
        // Use the role from activeOrganization (already fetched by MultiOrgContext)
        const userRole = activeOrganization.role;

        if (!userRole || !activeOrganization.isActive) {
          console.error("User not active in organization");
          router.push("/dashboard");
          return;
        }

        // Check if user has required role
        const hasRequiredRole = requiredRoles.includes(
          userRole as "owner" | "admin"
        );

        if (!hasRequiredRole) {
          router.push("/dashboard");
          return;
        }

        setAuthorized(true);
      } catch (error) {
        console.error("Error in role check:", error);
        router.push("/dashboard");
      } finally {
        setLoading(false);
      }
    }

    checkUserRole();
  }, [
    user,
    authLoading,
    orgLoading,
    activeOrganization,
    router,
    requiredRoles,
  ]);

  if (authLoading || orgLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!authorized) {
    return null; // Router will redirect
  }

  return <>{children}</>;
}
