"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@eq-ex/ui/components/card";
import { FileUpload } from "@app/components/file-upload";
import {
  updateCardFrontBackground,
  updateCardBackBackground,
  updateCardFrontDarkBackground,
  updateCardBackDarkBackground,
  updateOrganizationLogo,
} from "@app/data-access/actions/file-upload";
import { useMultiOrgContext } from "@app/contexts/multi-org-context";
import { useRouter } from "next/navigation";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@eq-ex/ui/components/tabs";
import { generateAndUploadOrgIcons } from "@app/utils/icon-generation";
import { createClient } from "@eq-ex/shared/client";

export function CardBackgroundUpload() {
  const { activeOrganization } = useMultiOrgContext();
  const router = useRouter();
  const [isUpdating, setIsUpdating] = useState(false);
  const [isGeneratingIcons, setIsGeneratingIcons] = useState(false);

  const handleFrontBackgroundUpload = async (result: {
    url: string;
    path: string;
  }) => {
    if (!activeOrganization?.id) return;

    try {
      setIsUpdating(true);
      await updateCardFrontBackground(activeOrganization.id, result.url);
      router.refresh(); // Refresh to show updated background
    } catch (error) {
      console.error("Failed to update front background:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleBackBackgroundUpload = async (result: {
    url: string;
    path: string;
  }) => {
    if (!activeOrganization?.id) return;

    try {
      setIsUpdating(true);
      await updateCardBackBackground(activeOrganization.id, result.url);
      router.refresh(); // Refresh to show updated background
    } catch (error) {
      console.error("Failed to update back background:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleFrontBackgroundRemove = async () => {
    if (!activeOrganization?.id) return;

    try {
      setIsUpdating(true);
      await updateCardFrontBackground(activeOrganization.id, null);
      router.refresh();
    } catch (error) {
      console.error("Failed to remove front background:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleBackBackgroundRemove = async () => {
    if (!activeOrganization?.id) return;

    try {
      setIsUpdating(true);
      await updateCardBackBackground(activeOrganization.id, null);
      router.refresh();
    } catch (error) {
      console.error("Failed to remove back background:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleFrontDarkBackgroundUpload = async (result: {
    url: string;
    path: string;
  }) => {
    if (!activeOrganization?.id) return;

    try {
      setIsUpdating(true);
      await updateCardFrontDarkBackground(activeOrganization.id, result.url);
      router.refresh(); // Refresh to show updated background
    } catch (error) {
      console.error("Failed to update front dark background:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleBackDarkBackgroundUpload = async (result: {
    url: string;
    path: string;
  }) => {
    if (!activeOrganization?.id) return;

    try {
      setIsUpdating(true);
      await updateCardBackDarkBackground(activeOrganization.id, result.url);
      router.refresh(); // Refresh to show updated background
    } catch (error) {
      console.error("Failed to update back dark background:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleFrontDarkBackgroundRemove = async () => {
    if (!activeOrganization?.id) return;

    try {
      setIsUpdating(true);
      await updateCardFrontDarkBackground(activeOrganization.id, null);
      router.refresh();
    } catch (error) {
      console.error("Failed to remove front dark background:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleBackDarkBackgroundRemove = async () => {
    if (!activeOrganization?.id) return;

    try {
      setIsUpdating(true);
      await updateCardBackDarkBackground(activeOrganization.id, null);
      router.refresh();
    } catch (error) {
      console.error("Failed to remove back dark background:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleLogoUpload = async (result: { url: string; path: string }) => {
    if (!activeOrganization?.id) return;

    try {
      setIsUpdating(true);

      // Update organization logo URL
      await updateOrganizationLogo(activeOrganization.id, result.url);

      // Generate PWA icons with new logo
      setIsGeneratingIcons(true);
      try {
        const supabase = createClient();
        await generateAndUploadOrgIcons(
          {
            id: activeOrganization.id,
            name: activeOrganization.organization_name || "Organization",
            primaryColor: activeOrganization.primary_color || "#4A90E2",
            secondaryColor: activeOrganization.secondary_color || "#7B68EE",
            logoUrl: result.url,
            subdomain: activeOrganization.subdomain || "",
          },
          supabase
        );
        console.log(
          "✅ PWA icons and splash screens regenerated with new logo"
        );
      } catch (iconError) {
        console.warn(
          "⚠️ Logo updated but icon and splash screen generation failed:",
          iconError
        );
      } finally {
        setIsGeneratingIcons(false);
      }

      router.refresh(); // Refresh to show updated logo
    } catch (error) {
      console.error("Failed to update logo:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleLogoRemove = async () => {
    if (!activeOrganization?.id) return;

    try {
      setIsUpdating(true);

      // Remove organization logo
      await updateOrganizationLogo(activeOrganization.id, null);

      // Regenerate PWA icons without logo (will use initials)
      setIsGeneratingIcons(true);
      try {
        const supabase = createClient();
        await generateAndUploadOrgIcons(
          {
            id: activeOrganization.id,
            name: activeOrganization.organization_name || "Organization",
            primaryColor: activeOrganization.primary_color || "#4A90E2",
            secondaryColor: activeOrganization.secondary_color || "#7B68EE",
            logoUrl: undefined,
            subdomain: activeOrganization.subdomain || "",
          },
          supabase
        );
        console.log("✅ PWA icons and splash screens regenerated without logo");
      } catch (iconError) {
        console.warn(
          "⚠️ Logo removed but icon and splash screen generation failed:",
          iconError
        );
      } finally {
        setIsGeneratingIcons(false);
      }

      router.refresh();
    } catch (error) {
      console.error("Failed to remove logo:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Branding & Design</CardTitle>
        <CardDescription>
          Upload your organization logo and custom background images for reward
          cards. Logo uploads automatically generate PWA app icons and splash
          screens for mobile installations.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="logo" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="logo">Logo & Icons</TabsTrigger>
            <TabsTrigger value="front">Front Card</TabsTrigger>
            <TabsTrigger value="back">Back Card</TabsTrigger>
          </TabsList>

          <TabsContent value="logo" className="space-y-4">
            <div>
              <h3 className="text-lg font-medium mb-2">Organization Logo</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Upload your organization logo. This will automatically generate
                PWA app icons and splash screens for mobile installations and
                appear on reward cards.
              </p>
              <FileUpload
                label="Organization Logo"
                currentImage={activeOrganization?.logo_url || undefined}
                bucket="card-backgrounds"
                folder={`organizations/${activeOrganization?.id}/logo`}
                onUploadComplete={handleLogoUpload}
                onRemove={handleLogoRemove}
                accept="image/*"
                maxSizeMB={5}
                disabled={isUpdating || isGeneratingIcons}
              />
              {isGeneratingIcons && (
                <div className="mt-2 text-sm text-blue-600">
                  🔄 Generating PWA icons and splash screens with new logo...
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="front" className="space-y-4">
            <div>
              <h3 className="text-lg font-medium mb-2">
                Front Card Background (Light Mode)
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                This background appears behind your company name and reward
                offer on the front of the card in light mode.
              </p>
              <FileUpload
                label="Front Background Image (Light)"
                currentImage={undefined} // TODO: Fetch from organization config
                bucket="card-backgrounds"
                folder={`organizations/${activeOrganization?.id}/front`}
                onUploadComplete={handleFrontBackgroundUpload}
                onRemove={handleFrontBackgroundRemove}
                accept="image/*"
                maxSizeMB={5}
                disabled={isUpdating}
              />
            </div>
            <div>
              <h3 className="text-lg font-medium mb-2">
                Front Card Background (Dark Mode)
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                This background appears behind your company name and reward
                offer on the front of the card in dark mode.
              </p>
              <FileUpload
                label="Front Background Image (Dark)"
                currentImage={undefined} // TODO: Fetch from organization config
                bucket="card-backgrounds"
                folder={`organizations/${activeOrganization?.id}/front-dark`}
                onUploadComplete={handleFrontDarkBackgroundUpload}
                onRemove={handleFrontDarkBackgroundRemove}
                accept="image/*"
                maxSizeMB={5}
                disabled={isUpdating}
              />
            </div>
          </TabsContent>

          <TabsContent value="back" className="space-y-4">
            <div>
              <h3 className="text-lg font-medium mb-2">
                Back Card Background (Light Mode)
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                This background appears behind the stamp grid and terms on the
                back of the card in light mode.
              </p>
              <FileUpload
                label="Back Background Image (Light)"
                currentImage={undefined} // TODO: Fetch from organization config
                bucket="card-backgrounds"
                folder={`organizations/${activeOrganization?.id}/back`}
                onUploadComplete={handleBackBackgroundUpload}
                onRemove={handleBackBackgroundRemove}
                accept="image/*"
                maxSizeMB={5}
                disabled={isUpdating}
              />
            </div>
            <div>
              <h3 className="text-lg font-medium mb-2">
                Back Card Background (Dark Mode)
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                This background appears behind the stamp grid and terms on the
                back of the card in dark mode.
              </p>
              <FileUpload
                label="Back Background Image (Dark)"
                currentImage={undefined} // TODO: Fetch from organization config
                bucket="card-backgrounds"
                folder={`organizations/${activeOrganization?.id}/back-dark`}
                onUploadComplete={handleBackDarkBackgroundUpload}
                onRemove={handleBackDarkBackgroundRemove}
                accept="image/*"
                maxSizeMB={5}
                disabled={isUpdating}
              />
            </div>
          </TabsContent>
        </Tabs>

        <div className="text-sm text-muted-foreground mt-6 space-y-2">
          <p>
            <strong>Logo:</strong> Square images work best, PNG format
            recommended for transparency, max 5MB
          </p>
          <p>
            <strong>Backgrounds:</strong> High-quality images, 375x225px or
            larger, PNG or JPEG format, max 5MB
          </p>
          <p>
            Background images will be automatically scaled and positioned to fit
            the card. Logo uploads automatically generate PWA app icons and
            splash screens in multiple sizes.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
