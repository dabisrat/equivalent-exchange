// create a button component
"use client";

import { Button } from "@eq-ex/ui/components/button";
import { createGoogleWalletLoyaltyClass } from "@app/data-access/actions/create-google-wallet-class";
import { useMultiOrgContext } from "@app/contexts/multi-org-context";
import { toast } from "sonner";

export function CreateWalletClassButton() {
  const { activeOrganization } = useMultiOrgContext();

  const handleClick = async () => {
    if (!activeOrganization) {
      toast.error("No active organization selected.");
      return;
    }
    const organizationData = {
      organizationId: activeOrganization.id,
      organizationName: activeOrganization.organization_name ?? "",
      logoUrl: activeOrganization.logo_url ?? "",
      primaryColor: activeOrganization.primary_color ?? "",
    };

    try {
      await createGoogleWalletLoyaltyClass(organizationData);
      toast.success("Google Wallet Loyalty Class created successfully!");
    } catch (error) {
      console.error("Error creating Google Wallet Loyalty Class:", error);
      toast.error("Failed to create Google Wallet Loyalty Class.");
    }
  };

  return (
    <Button onClick={handleClick}>Create Google Wallet Loyalty Class</Button>
  );
}
