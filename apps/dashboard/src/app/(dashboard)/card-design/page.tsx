import { OrganizationAdminRoute } from "@app/components/organization-admin-route";
import { CardBackgroundUpload } from "@app/components/card-background-upload";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@eq-ex/ui/components/tabs";
import { WalletClassConfigForm } from "@app/components/wallet-class-config-form";

export default async function CardDesignPage() {
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
            <CardBackgroundUpload />
          </TabsContent>

          <TabsContent value="apple-wallet" className="space-y-4">
            {/* Back card config - placeholder */}
            <div>Apple configuration coming soon</div>
          </TabsContent>

          <TabsContent value="google-wallet" className="space-y-4">
            <WalletClassConfigForm />
          </TabsContent>
        </Tabs>
      </div>
    </OrganizationAdminRoute>
  );
}
