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
  FormDescription,
} from "@eq-ex/ui/components/form";
import { useMultiOrgContext } from "@app/contexts/multi-org-context";
import { updateAppleWalletPassConfig } from "@app/data-access/actions/update-apple-wallet-config";
import { getOrganizationById } from "@app/data-access/queries/organizations";
import { toast } from "sonner";
import type { OrganizationCardConfig } from "@eq-ex/shared/schemas/card-config";

const appleWalletPassConfigSchema = z.object({
  backgroundColor: z
    .string()
    .refine(
      (val) => val === "" || /^#[0-9A-F]{6}$/i.test(val),
      "Must be a valid hex color or empty"
    )
    .optional(),
  foregroundColor: z
    .string()
    .refine(
      (val) => val === "" || /^#[0-9A-F]{6}$/i.test(val),
      "Must be a valid hex color or empty"
    )
    .optional(),
  labelColor: z
    .string()
    .refine(
      (val) => val === "" || /^#[0-9A-F]{6}$/i.test(val),
      "Must be a valid hex color or empty"
    )
    .optional(),
  logoText: z
    .string()
    .max(50, "Logo text must be 50 characters or less")
    .optional(),
  description: z
    .string()
    .max(200, "Description must be 200 characters or less")
    .optional(),
  stripImage: z
    .string()
    .refine((val) => {
      if (val === "" || !val) return true;
      try {
        const url = new URL(val);
        return url.protocol === "https:";
      } catch {
        return false;
      }
    }, "Must be a valid HTTPS URL or empty")
    .optional()
    .or(z.literal("")),
  iconImage: z
    .string()
    .refine((val) => {
      if (val === "" || !val) return true;
      try {
        const url = new URL(val);
        return url.protocol === "https:";
      } catch {
        return false;
      }
    }, "Must be a valid HTTPS URL or empty")
    .optional()
    .or(z.literal("")),
  logoImage: z
    .string()
    .refine((val) => {
      if (val === "" || !val) return true;
      try {
        const url = new URL(val);
        return url.protocol === "https:";
      } catch {
        return false;
      }
    }, "Must be a valid HTTPS URL or empty")
    .optional()
    .or(z.literal("")),
});

type AppleWalletPassConfigFormData = z.infer<
  typeof appleWalletPassConfigSchema
>;

export function AppleWalletPassConfigForm() {
  const { activeOrganization } = useMultiOrgContext();
  const [loading, setLoading] = useState(true);
  const [cardConfig, setCardConfig] = useState<OrganizationCardConfig | null>(
    null
  );

  const appleConfig = cardConfig?.apple_wallet_pass_config;
  const defaultBackgroundColor =
    appleConfig?.backgroundColor ||
    activeOrganization?.primary_color ||
    "#3b82f6";
  const defaultForegroundColor = appleConfig?.foregroundColor || "#ffffff";
  const defaultLabelColor = appleConfig?.labelColor || "#e5e7eb";
  const defaultLogoText =
    appleConfig?.logoText || activeOrganization?.organization_name || "";
  const defaultDescription =
    appleConfig?.description ||
    `${activeOrganization?.organization_name} Loyalty Card` ||
    "";
  const defaultStripImage = appleConfig?.stripImage || "";
  const defaultIconImage =
    appleConfig?.iconImage || activeOrganization?.logo_url || "";
  const defaultLogoImage =
    appleConfig?.logoImage || activeOrganization?.logo_url || "";

  const form = useForm<AppleWalletPassConfigFormData>({
    resolver: zodResolver(appleWalletPassConfigSchema),
    defaultValues: {
      backgroundColor: defaultBackgroundColor,
      foregroundColor: defaultForegroundColor,
      labelColor: defaultLabelColor,
      logoText: defaultLogoText,
      description: defaultDescription,
      stripImage: defaultStripImage,
      iconImage: defaultIconImage,
      logoImage: defaultLogoImage,
    },
  });

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

  // Update form when cardConfig loads or organization changes
  useEffect(() => {
    if (cardConfig !== null || activeOrganization) {
      form.reset({
        backgroundColor:
          appleConfig?.backgroundColor ||
          activeOrganization?.primary_color ||
          "#3b82f6",
        foregroundColor: appleConfig?.foregroundColor || "#ffffff",
        labelColor: appleConfig?.labelColor || "#e5e7eb",
        logoText:
          appleConfig?.logoText || activeOrganization?.organization_name || "",
        description:
          appleConfig?.description ||
          `${activeOrganization?.organization_name} Loyalty Card` ||
          "",
        stripImage: appleConfig?.stripImage || "",
        iconImage: appleConfig?.iconImage || activeOrganization?.logo_url || "",
        logoImage: appleConfig?.logoImage || activeOrganization?.logo_url || "",
      });
    }
  }, [cardConfig, activeOrganization, form, appleConfig]);

  const handleApplyConfig = async (data: AppleWalletPassConfigFormData) => {
    if (!activeOrganization) return;

    try {
      const result = await updateAppleWalletPassConfig({
        organizationId: activeOrganization.id,
        appleWalletPassConfig: data,
      });

      if (result.success) {
        toast.success("Apple Wallet pass configuration saved successfully!");
        // Refresh card config
        const refreshResult = await getOrganizationById(activeOrganization.id);
        if (refreshResult.success && refreshResult.data) {
          setCardConfig(
            refreshResult.data.card_config as unknown as OrganizationCardConfig
          );
        }
      } else {
        toast.error(result.error || "Failed to save configuration");
      }
    } catch (error) {
      toast.error("An error occurred while saving the configuration");
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
        <CardTitle>Apple Wallet Pass Configuration</CardTitle>
        <CardDescription>
          Customize the appearance of your Apple Wallet loyalty passes. Images
          will be downloaded and validated when generating passes.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleApplyConfig)}
            className="space-y-4"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="backgroundColor"
                render={({ field }: { field: any }) => (
                  <FormItem>
                    <FormLabel>Background Color</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="#3b82f6"
                        {...field}
                        type="color"
                        className="h-10"
                      />
                    </FormControl>
                    <FormDescription>
                      Background color of the pass
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="foregroundColor"
                render={({ field }: { field: any }) => (
                  <FormItem>
                    <FormLabel>Foreground Color</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="#ffffff"
                        {...field}
                        type="color"
                        className="h-10"
                      />
                    </FormControl>
                    <FormDescription>Text color on the pass</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="labelColor"
                render={({ field }: { field: any }) => (
                  <FormItem>
                    <FormLabel>Label Color</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="#e5e7eb"
                        {...field}
                        type="color"
                        className="h-10"
                      />
                    </FormControl>
                    <FormDescription>Field label color</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="logoText"
                render={({ field }: { field: any }) => (
                  <FormItem>
                    <FormLabel>Logo Text</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., My Business" {...field} />
                    </FormControl>
                    <FormDescription>
                      Text displayed next to logo
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }: { field: any }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., Loyalty rewards card"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Brief description of the pass
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 gap-4">
              <FormField
                control={form.control}
                name="stripImage"
                render={({ field }: { field: any }) => (
                  <FormItem>
                    <FormLabel>Strip Image URL</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="https://example.com/strip.png"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Image displayed behind primary fields. Provide at @2x
                      (750x246px) or @3x (1125x369px) resolution for best
                      quality.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="iconImage"
                render={({ field }: { field: any }) => (
                  <FormItem>
                    <FormLabel>Icon Image URL</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="https://example.com/icon.png"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Square icon image. Provide at @2x (58x58px) or @3x
                      (87x87px) resolution for best quality.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="logoImage"
                render={({ field }: { field: any }) => (
                  <FormItem>
                    <FormLabel>Logo Image URL</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="https://example.com/logo.png"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Logo displayed in top left. Provide at @2x (320x100px) or
                      @3x (480x150px) resolution for best quality.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? "Saving..." : "Save Configuration"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
