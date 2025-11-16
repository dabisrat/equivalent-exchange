"use client";

import { useEffect, useState } from "react";
import { OrganizationAdminRoute } from "@app/components/organization-admin-route";
import { CardDesignForm } from "@app/components/card-design/CardDesignForm";
import { CardPreview } from "@app/components/card-design/CardPreview";
import { useMultiOrgContext } from "@app/contexts/multi-org-context";
import { getOrganizationById } from "@app/data-access/queries/organizations";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@eq-ex/ui/components/tabs";
import { WalletClassConfigForm } from "@app/components/wallet-class-config-form";
import { AppleWalletPassConfigForm } from "@app/components/apple-wallet-pass-config-form";

export default function CardDesignPage() {
  const { activeOrganization } = useMultiOrgContext();
  const [orgData, setOrgData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState<any>(null);

  useEffect(() => {
    async function fetchOrgData() {
      if (!activeOrganization?.id) return;

      const result = await getOrganizationById(activeOrganization.id);
      if (result.success) {
        setOrgData(result.data);
      }
      setLoading(false);
    }

    fetchOrgData();
  }, [activeOrganization?.id]);

  const handleFormChange = (data: any) => {
    setFormData(data);
  };

  if (!activeOrganization || loading) {
    return (
      <OrganizationAdminRoute>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </OrganizationAdminRoute>
    );
  }

  if (!orgData) {
    return (
      <OrganizationAdminRoute>
        <div>Failed to load organization data</div>
      </OrganizationAdminRoute>
    );
  }

  return (
    <OrganizationAdminRoute>
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
        {/* Card Design Header */}
        <div className="flex items-center justify-between px-4 lg:px-6">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Branding & Design
            </h1>
            <p className="text-muted-foreground">
              Customize your organization logo, PWA app icons, and reward card
              background images.
            </p>
          </div>
        </div>

        <Tabs defaultValue="branding" className="px-4 lg:px-6">
          <TabsList>
            <TabsTrigger value="branding">Main App</TabsTrigger>
            <TabsTrigger value="google-wallet">Google Wallet</TabsTrigger>
            <TabsTrigger value="apple-wallet">Apple Wallet</TabsTrigger>
          </TabsList>

          <TabsContent value="branding" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <CardDesignForm
                initialConfig={orgData.card_config}
                organizationId={orgData.id}
                primaryColor={orgData.primary_color}
                maxPoints={orgData.max_points}
                onChange={handleFormChange}
              />
              {/* <CardPreview
                config={orgData.card_config}
                primaryColor={orgData.primary_color}
                maxPoints={orgData.max_points}
                logoUrl={orgData.logo_url}
                formData={formData}
              /> */}
            </div>
          </TabsContent>

          <TabsContent value="apple-wallet" className="space-y-4">
            <AppleWalletPassConfigForm />
          </TabsContent>

          <TabsContent value="google-wallet" className="space-y-4">
            <WalletClassConfigForm />
          </TabsContent>
        </Tabs>
      </div>
    </OrganizationAdminRoute>
  );
}
