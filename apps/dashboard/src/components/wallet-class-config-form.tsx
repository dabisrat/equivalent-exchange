"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@eq-ex/ui/components/button";
import { Input } from "@eq-ex/ui/components/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@eq-ex/ui/components/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@eq-ex/ui/components/form";
import { useMultiOrgContext } from "@app/contexts/multi-org-context";
import { updateGoogleWalletClassConfig } from "@app/data-access/actions/create-google-wallet-class";
import { getOrganizationById } from "@app/data-access/queries/organizations";
import { createGoogleWalletLoyaltyClass } from "@app/data-access/actions/create-google-wallet-class";
import { toast } from "sonner";
import type { OrganizationCardConfig } from "@eq-ex/shared/schemas/card-config";
import { PreviewWalletPass } from "./preview-wallet-pass";

const walletClassConfigSchema = z.object({
  programName: z.string().optional(),
  hexBackgroundColor: z
    .string()
    .refine(
      (val) => val === "" || /^#[0-9A-F]{6}$/i.test(val),
      "Must be a valid hex color or empty"
    )
    .optional(),
  programLogoUrl: z
    .string()
    .url("Must be a valid URL")
    .optional()
    .or(z.literal("")),
  heroImageUrl: z
    .string()
    .url("Must be a valid URL")
    .optional()
    .or(z.literal("")),
});

type WalletClassConfigFormData = z.infer<typeof walletClassConfigSchema>;

export function WalletClassConfigForm() {
  const { activeOrganization } = useMultiOrgContext();
  const [cardConfig, setCardConfig] = useState<OrganizationCardConfig | null>(
    null
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (activeOrganization?.id) {
      getOrganizationById(activeOrganization.id).then((result) => {
        if (result.success && result.data) {
          setCardConfig(
            result.data.card_config as unknown as OrganizationCardConfig
          );
        }
        setLoading(false);
      });
    }
  }, [activeOrganization?.id]);

  const walletConfig = cardConfig?.google_wallet_class_config;

  // Compute default values
  const defaultProgramName =
    walletConfig?.programName ||
    `${activeOrganization?.organization_name?.substring(0, 15)} Rewards` ||
    "";
  const defaultHexBackgroundColor =
    walletConfig?.hexBackgroundColor ||
    activeOrganization?.primary_color ||
    "#3b82f6";
  const defaultProgramLogoUrl =
    walletConfig?.programLogoUrl || activeOrganization?.logo_url || "";
  const defaultHeroImageUrl = walletConfig?.heroImageUrl || "";

  const form = useForm<WalletClassConfigFormData>({
    resolver: zodResolver(walletClassConfigSchema),
    defaultValues: {
      programName: defaultProgramName,
      hexBackgroundColor: defaultHexBackgroundColor,
      programLogoUrl: defaultProgramLogoUrl,
      heroImageUrl: defaultHeroImageUrl,
    },
  });

  // Update form when cardConfig loads or organization changes
  useEffect(() => {
    if (cardConfig !== null || activeOrganization) {
      // cardConfig loaded (even if null) or org changed
      form.reset({
        programName:
          walletConfig?.programName ||
          `${activeOrganization?.organization_name?.substring(0, 15)} Rewards` ||
          "",
        hexBackgroundColor:
          walletConfig?.hexBackgroundColor ||
          activeOrganization?.primary_color ||
          "#3b82f6",
        programLogoUrl:
          walletConfig?.programLogoUrl || activeOrganization?.logo_url || "",
        heroImageUrl: walletConfig?.heroImageUrl || "",
      });
    }
  }, [cardConfig, activeOrganization, form]);

  const handleApplyConfig = async (data: WalletClassConfigFormData) => {
    if (!activeOrganization) return;

    try {
      // First save the config
      const saveResult = await updateGoogleWalletClassConfig({
        organizationId: activeOrganization.id,
        googleWalletClassConfig: data,
      });

      if (!saveResult.success) {
        toast.error(saveResult.error || "Failed to save config");
        return;
      }

      // Then create/update the class
      const createResult = await createGoogleWalletLoyaltyClass({
        organizationId: activeOrganization.id,
        organizationName: activeOrganization.organization_name ?? "",
      });

      if (createResult.success) {
        toast.success(
          "Configuration saved and Google Wallet class created/updated successfully!"
        );
        // Refresh card config
        const refreshResult = await getOrganizationById(activeOrganization.id);
        if (refreshResult.success && refreshResult.data) {
          setCardConfig(
            refreshResult.data.card_config as unknown as OrganizationCardConfig
          );
        }
      } else {
        toast.error(createResult.error || "Failed to create class");
      }
    } catch (error) {
      toast.error("An error occurred while applying the configuration");
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div>Loading configuration...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Google Wallet Pass Configuration</CardTitle>
        <CardDescription>
          Customize the appearance of your Google Wallet loyalty passes.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex justify-between flex-wrap">
          {/* Form Column */}
          <div className="w-140">
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(handleApplyConfig)}
                className="space-y-4"
              >
                <FormField
                  control={form.control}
                  name="programName"
                  render={({ field }: { field: any }) => (
                    <FormItem>
                      <FormLabel>Program Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., My Rewards Program"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="hexBackgroundColor"
                  render={({ field }: { field: any }) => (
                    <FormItem>
                      <FormLabel>Background Color</FormLabel>
                      <FormControl>
                        <Input type="color" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="programLogoUrl"
                  render={({ field }: { field: any }) => (
                    <FormItem>
                      <FormLabel>Program Logo URL</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="https://example.com/logo.png"
                          {...field}
                        />
                      </FormControl>
                      {field.value && (
                        <div className="mt-2">
                          <img
                            src={field.value}
                            alt="Logo preview"
                            className="w-16 h-16 object-cover rounded border"
                            onError={(e) => {
                              e.currentTarget.style.display = "none";
                            }}
                          />
                        </div>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="heroImageUrl"
                  render={({ field }: { field: any }) => (
                    <FormItem>
                      <FormLabel>Hero Image URL</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="https://example.com/hero.png"
                          {...field}
                        />
                      </FormControl>
                      {field.value && (
                        <div className="mt-2">
                          <img
                            src={field.value}
                            alt="Hero image preview"
                            className="w-32 h-20 object-cover rounded border"
                            onError={(e) => {
                              e.currentTarget.style.display = "none";
                            }}
                          />
                        </div>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting
                    ? "Applying..."
                    : "Apply Configuration"}
                </Button>
              </form>
            </Form>
          </div>

          {/* Preview Column */}
          <div className="w-90">
            <h3 className="text-lg mb-4">Pass Preview</h3>
            {/* TODO: get max points and pass to the preview component */}
            <PreviewWalletPass
              className="p-0 rounded-3xl gap-0"
              programName={form.watch("programName")}
              hexBackgroundColor={form.watch("hexBackgroundColor")}
              programLogoUrl={form.watch("programLogoUrl")}
              heroImageUrl={form.watch("heroImageUrl")}
              issuerName={activeOrganization?.organization_name || undefined}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
