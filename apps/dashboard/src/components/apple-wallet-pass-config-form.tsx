"use client";

import { useEffect, useState } from "react";
import { toDataURL } from "qrcode";
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
    cardConfig?.card_front_config?.offer_description || "";
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
        description: cardConfig?.card_front_config?.offer_description || "",
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

            {/* Hidden description field - still part of form but not visible */}
            <input type="hidden" {...form.register("description")} />

            <div className="grid grid-cols-1 gap-4">
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
                    {field.value && (
                      <div className="mt-2">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={field.value}
                          alt="Logo preview"
                          className="w-12 h-12 object-cover rounded border"
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
                    {field.value && (
                      <div className="mt-2">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={field.value}
                          alt="Strip preview"
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
                    {field.value && (
                      <div className="mt-2">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        {/* <img
                          src={field.value}
                          alt="Icon preview"
                          className="w-12 h-12 object-cover rounded-full border"
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                          }}
                        /> */}
                      </div>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex items-start gap-6">
              <div className="flex-1">
                <Button type="submit" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting
                    ? "Saving..."
                    : "Save Configuration"}
                </Button>
              </div>

              {/* Live visual preview */}
              <div className="w-80 hidden md:block">
                {/* Use form.watch to get live-updating values */}
                <PassPreview
                  values={
                    form.watch() as unknown as AppleWalletPassConfigFormData
                  }
                  org={activeOrganization}
                />
              </div>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

function PassPreview({
  values,
  org,
}: {
  values: AppleWalletPassConfigFormData;
  org: any;
}) {
  const bg = values.backgroundColor || org?.primary_color || "#3b82f6";
  const fg = values.foregroundColor || "#ffffff";
  const label = values.labelColor || "#e5e7eb";
  const logoText = values.logoText || org?.organization_name || "";
  const description =
    values.description || `${org?.organization_name} Loyalty Card` || "";
  const strip = values.stripImage || "";
  const icon = values.iconImage || org?.logo_url || "";
  const logo = values.logoImage || org?.logo_url || "";

  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const value = `https://example.com/p/${org?.id || "preview"}`;
    (async () => {
      try {
        const url = await toDataURL(value, { margin: 1, width: 320 });
        if (mounted) setQrDataUrl(url);
      } catch (err) {
        // ignore for preview
        if (mounted) setQrDataUrl(null);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [org?.id]);

  return (
    <div
      className="rounded-xl overflow-hidden shadow-lg border"
      style={{ background: bg }}
    >
      {/* Top header */}
      <div
        className="flex items-center justify-between p-4"
        style={{ background: bg }}
      >
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded bg-white/20 flex items-center justify-center overflow-hidden">
            {logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={logo}
                alt="logo"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="text-white font-bold">
                {(logoText || "").charAt(0)}
              </div>
            )}
          </div>

          <div>
            <div
              className="text-xl font-semibold leading-tight"
              style={{ color: fg }}
            >
              {logoText || org?.organization_name}
            </div>
          </div>
        </div>

        <div className="text-right">
          <div className="text-sm font-semibold" style={{ color: label }}>
            Stamps
          </div>
          <div className="text-lg" style={{ color: fg }}>
            2/10
          </div>
        </div>
      </div>

      {/* Strip image */}
      {strip ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={strip} alt="strip" className="w-full h-28 object-cover" />
      ) : (
        <div className="w-full h-28 bg-black/10" />
      )}

      {/* Body */}
      <div className="p-4" style={{ background: bg }}>
        <div className="grid grid-cols-2 gap-4 text-white">
          <div>
            <div className="text-sm font-semibold" style={{ color: label }}>
              Organization
            </div>
            <div className="text-sm" style={{ color: fg }}>
              {org?.organization_name}
            </div>
          </div>
          <div>
            <div className="text-sm font-semibold" style={{ color: label }}>
              Offer
            </div>
            <div className="text-xs" style={{ color: fg }}>
              {description}
            </div>
          </div>
        </div>

        <div className="mt-4 rounded-lg p-4 flex items-center justify-center">
          {/* Render QR data URL generated by qrcode lib */}
          {qrDataUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={qrDataUrl} alt="qr" className="w-36 h-36 object-cover" />
          ) : (
            <div className="w-36 h-36 bg-black/10" />
          )}
        </div>
      </div>

      <div
        className="p-2 flex justify-between items-center"
        style={{ background: bg }}
      ></div>
    </div>
  );
}
