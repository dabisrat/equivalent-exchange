"use client";

import { OrganizationAdminRoute } from "@app/components/organization-admin-route";
import { CardBackgroundUpload } from "@app/components/card-background-upload";
import { Button } from "@eq-ex/ui/components/button";
import { createGoogleWalletLoyaltyClass } from "@app/data-access/actions/create-google-wallet-class";
import { CreateWalletClassButton } from "@app/components/create-wallet-class-button";

export default function CardDesignPage() {
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

        {/* Card Background Upload */}
        <div className="px-4 lg:px-6">
          <CardBackgroundUpload />
        </div>

        <div className="px-4 lg:px-6">
          <CreateWalletClassButton></CreateWalletClassButton>
        </div>
      </div>
    </OrganizationAdminRoute>
  );
}
