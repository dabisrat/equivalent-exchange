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
} from "@app/data-access/actions/file-upload";
import { useMultiOrgContext } from "@app/contexts/multi-org-context";
import { useRouter } from "next/navigation";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@eq-ex/ui/components/tabs";

export function CardBackgroundUpload() {
  const { activeOrganization } = useMultiOrgContext();
  const router = useRouter();
  const [isUpdating, setIsUpdating] = useState(false);

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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Card Background Images</CardTitle>
        <CardDescription>
          Upload custom background images for your reward cards. These will
          appear behind the card content.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="front" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="front">Front Card</TabsTrigger>
            <TabsTrigger value="back">Back Card</TabsTrigger>
          </TabsList>

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

        <div className="text-sm text-muted-foreground mt-6">
          <p>
            Recommended: High-quality images, 375x225px or larger, PNG or JPEG
            format, max 5MB
          </p>
          <p>
            Background images will be automatically scaled and positioned to fit
            the card.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
