"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useMultiOrgContext } from "@app/contexts/multi-org-context";
import { updateCardConfig } from "@app/data-access/actions/file-upload";
import { updateOrganization } from "@app/data-access/actions/organizations";
import { normalizeCardConfig } from "@eq-ex/shared/utils/normalize-card-config";
import {
  PUNCH_ICON_OPTIONS,
  type PunchIconKey,
} from "@eq-ex/shared/utils/punch-icons";
import { OrganizationCardConfig } from "@eq-ex/shared/schemas/card-config";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@eq-ex/ui/components/card";
import { Button } from "@eq-ex/ui/components/button";
import { Input } from "@eq-ex/ui/components/input";
import { FileUpload } from "@app/components/file-upload";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@eq-ex/ui/components/select";
import { Checkbox } from "@eq-ex/ui/components/checkbox";
import {
  updateCardFrontBackground,
  updateCardBackBackground,
  updateCardFrontDarkBackground,
  updateCardBackDarkBackground,
  updateOrganizationLogo,
} from "@app/data-access/actions/file-upload";
import {
  generateClientAssets,
  deleteClientAssets,
} from "@app/data-access/actions/client-assets";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@eq-ex/ui/components/tabs";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@eq-ex/ui/components/form";

// Form schema
const cardDesignSchema = z.object({
  // Organization settings
  primary_color: z
    .string()
    .regex(/^#[0-9A-F]{6}$/i, "Must be a valid hex color")
    .nullable()
    .or(z.literal("")),

  max_points: z.number().int().min(1).max(100),

  // Front card config
  company_name: z.string().max(100),
  offer_description: z.string().max(200),
  front_website_link: z.string().url().or(z.literal("")),
  show_front_content: z.boolean(),

  // Back card config
  back_website_link: z.string().url().or(z.literal("")),
  description: z.string().max(200),

  // Layout config
  layout_variant: z.enum([
    "vertical",
    "grid-first",
    "two-column",
    "two-column-reverse",
    "custom",
  ]),

  // Punch config
  punch_size_punched: z.enum(["small", "medium", "large"]),
  punch_size_unpunched: z.enum(["small", "medium", "large"]),
  punch_icon_punched: z.enum(PUNCH_ICON_OPTIONS),
  punch_icon_unpunched: z.enum(PUNCH_ICON_OPTIONS),
  punch_animation_enabled: z.boolean(),
  punch_animation_type: z.enum([
    "spin",
    "pulse",
    "bounce",
    "flip",
    "ping",
    "fill",
  ]),
});

type CardDesignFormData = z.infer<typeof cardDesignSchema>;

interface CardDesignFormProps {
  initialConfig?: Partial<OrganizationCardConfig>;
  organizationId: string;
  primaryColor?: string | null;
  maxPoints: number;
  onChange?: (data: CardDesignFormData) => void;
}

export function CardDesignForm({
  initialConfig,
  organizationId,
  primaryColor,
  maxPoints,
  onChange,
}: CardDesignFormProps) {
  const router = useRouter();
  const { activeOrganization } = useMultiOrgContext();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isGeneratingIcons, setIsGeneratingIcons] = useState(false);

  const normalizedConfig = normalizeCardConfig(initialConfig);

  // Extract current background URLs for previews
  const frontBackgroundUrl =
    normalizedConfig.card_front_config.background_image;
  const frontDarkBackgroundUrl =
    normalizedConfig.card_front_config.dark_background_image;
  const backBackgroundUrl = normalizedConfig.card_back_config.background_image;
  const backDarkBackgroundUrl =
    normalizedConfig.card_back_config.dark_background_image;

  const defaultValues: CardDesignFormData = {
    primary_color: primaryColor || "#000000",
    max_points: maxPoints,
    company_name: normalizedConfig.card_front_config.company_name || "",
    offer_description:
      normalizedConfig.card_front_config.offer_description || "",
    front_website_link: normalizedConfig.card_front_config.website_link || "",
    show_front_content: normalizedConfig.card_front_config.show_content ?? true,
    back_website_link: normalizedConfig.card_back_config.website_link || "",
    description: normalizedConfig.card_back_config.description || "",
    layout_variant: normalizedConfig.card_layout_config.variant,
    punch_size_punched: normalizedConfig.punch_node_config.size.punched,
    punch_size_unpunched: normalizedConfig.punch_node_config.size.unpunched,
    punch_icon_punched: normalizedConfig.punch_node_config.icons
      .punched as PunchIconKey,
    punch_icon_unpunched: normalizedConfig.punch_node_config.icons
      .unpunched as PunchIconKey,
    punch_animation_enabled:
      normalizedConfig.punch_node_config.animation?.enabled ?? true,
    punch_animation_type:
      normalizedConfig.punch_node_config.animation?.loading?.type || "spin",
  };

  const form = useForm<CardDesignFormData>({
    resolver: zodResolver(cardDesignSchema),
    defaultValues,
  });

  // Watch for changes and call onChange
  useEffect(() => {
    const subscription = form.watch((data) => {
      onChange?.(data as CardDesignFormData);
    });
    return () => subscription.unsubscribe();
  }, [form.watch, onChange]);

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

      // Delete existing PWA icons
      setIsGeneratingIcons(true);
      try {
        await generateClientAssets({
          organizationId: activeOrganization.id,
          logoUrl: result.url,
          primaryColor: activeOrganization.primary_color || "#000000",
        });
        console.log("✅ PWA icons and splash screens deleted");
      } catch (iconError) {
        console.warn(
          "⚠️ Logo updated but icon and splash screen deletion failed:",
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

      // Delete existing PWA icons
      setIsGeneratingIcons(true);
      try {
        await deleteClientAssets({
          organizationId: activeOrganization.id,
        });
        console.log("✅ PWA icons and splash screens deleted");
      } catch (iconError) {
        console.warn(
          "⚠️ Logo removed but icon and splash screen deletion failed:",
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

  const onSubmit = async (data: CardDesignFormData) => {
    if (!activeOrganization?.id) return;

    setIsSubmitting(true);
    try {
      // Update organization settings
      await updateOrganization(activeOrganization.id, {
        primary_color: data.primary_color,
        max_points: data.max_points,
      });

      // Update card config
      const cardConfig: Partial<OrganizationCardConfig> = {
        card_front_config: {
          company_name: data.company_name,
          offer_description: data.offer_description,
          website_link: data.front_website_link,
          show_content: data.show_front_content,
        },
        card_back_config: {
          website_link: data.back_website_link,
          description: data.description,
        },
        card_layout_config: {
          variant: data.layout_variant,
        },
        punch_node_config: {
          size: {
            punched: data.punch_size_punched,
            unpunched: data.punch_size_unpunched,
            loading: data.punch_size_punched,
          },
          icons: {
            punched: data.punch_icon_punched,
            unpunched: data.punch_icon_unpunched,
            loading: data.punch_icon_punched,
          },
          animation: {
            enabled: data.punch_animation_enabled,
            loading: {
              type: data.punch_animation_type,
            },
          },
        },
      };

      await updateCardConfig(activeOrganization.id, cardConfig);

      router.refresh();
    } catch (error) {
      console.error("Failed to update card design:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <Card>
        <CardHeader>
          <CardTitle>Card Design</CardTitle>
          <CardDescription>
            Customize the appearance and content of your reward cards.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <Tabs defaultValue="logo" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="logo">Main Settings</TabsTrigger>
                  <TabsTrigger value="front">Front Card</TabsTrigger>
                  <TabsTrigger value="back">Back Card</TabsTrigger>
                  <TabsTrigger value="layout">Layout & Punch</TabsTrigger>
                </TabsList>

                <TabsContent value="logo" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="primary_color"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Primary Color</FormLabel>
                          <FormControl>
                            <div className="flex gap-2">
                              <Input
                                type="color"
                                {...field}
                                value={field.value || "#000000"}
                              />
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => field.onChange(null)}
                                disabled={!field.value}
                              >
                                Clear
                              </Button>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="max_points"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Max Points</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="1"
                              max="100"
                              {...field}
                              onChange={(e) =>
                                field.onChange(parseInt(e.target.value) || 1)
                              }
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium mb-2">
                      Organization Logo
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Upload your organization logo. This will automatically
                      delete any existing PWA app icons and splash screens and
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
                        🔄 Deleting PWA icons and splash screens...
                      </div>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="front" className="space-y-4">
                  <FormField
                    control={form.control}
                    name="company_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Company Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Your Company Name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="offer_description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Offer Description</FormLabel>
                        <FormControl>
                          <textarea
                            placeholder="Buy 9 Get 1 Free"
                            className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            rows={3}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="front_website_link"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Website Link</FormLabel>
                        <FormControl>
                          <Input placeholder="https://example.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="show_front_content"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Show Content Overlay</FormLabel>
                          <p className="text-sm text-muted-foreground">
                            Display company name, logo, and offer details on the
                            front of the card
                          </p>
                        </div>
                      </FormItem>
                    )}
                  />
                  <div>
                    <h3 className="text-lg font-medium mb-2">
                      Front Card Background (Light Mode)
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      This background appears behind your company name and
                      reward offer on the front of the card in light mode.
                    </p>
                    <FileUpload
                      label="Front Background Image (Light)"
                      currentImage={frontBackgroundUrl}
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
                      This background appears behind your company name and
                      reward offer on the front of the card in dark mode.
                    </p>
                    <FileUpload
                      label="Front Background Image (Dark)"
                      currentImage={frontDarkBackgroundUrl}
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
                  <FormField
                    control={form.control}
                    name="back_website_link"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Website Link</FormLabel>
                        <FormControl>
                          <Input placeholder="https://example.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <textarea
                            placeholder="Terms and conditions..."
                            className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            rows={3}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div>
                    <h3 className="text-lg font-medium mb-2">
                      Back Card Background (Light Mode)
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      This background appears behind the stamp grid and terms on
                      the back of the card in light mode.
                    </p>
                    <FileUpload
                      label="Back Background Image (Light)"
                      currentImage={backBackgroundUrl}
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
                      This background appears behind the stamp grid and terms on
                      the back of the card in dark mode.
                    </p>
                    <FileUpload
                      label="Back Background Image (Dark)"
                      currentImage={backDarkBackgroundUrl}
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

                <TabsContent value="layout" className="space-y-4">
                  <FormField
                    control={form.control}
                    name="layout_variant"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Layout Variant</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a layout variant" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="vertical">Vertical</SelectItem>
                            <SelectItem value="grid-first">
                              Grid First
                            </SelectItem>
                            <SelectItem value="two-column">
                              Two Column
                            </SelectItem>
                            <SelectItem value="two-column-reverse">
                              Two Column Reverse
                            </SelectItem>
                            <SelectItem value="custom">Custom</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="punch_size_punched"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Punch Size (Stamped)</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="small">Small</SelectItem>
                              <SelectItem value="medium">Medium</SelectItem>
                              <SelectItem value="large">Large</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="punch_size_unpunched"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Punch Size (Unstamped)</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="small">Small</SelectItem>
                              <SelectItem value="medium">Medium</SelectItem>
                              <SelectItem value="large">Large</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="punch_icon_punched"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Punch Icon (Stamped)</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {PUNCH_ICON_OPTIONS.map((icon) => (
                                <SelectItem key={icon} value={icon}>
                                  {icon}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="punch_icon_unpunched"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Punch Icon (Unstamped)</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {PUNCH_ICON_OPTIONS.map((icon) => (
                                <SelectItem key={icon} value={icon}>
                                  {icon}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="punch_animation_enabled"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Enable Animation</FormLabel>
                        </div>
                      </FormItem>
                    )}
                  />

                  {form.watch("punch_animation_enabled") && (
                    <FormField
                      control={form.control}
                      name="punch_animation_type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Animation Type</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="spin">Spin</SelectItem>
                              <SelectItem value="pulse">Pulse</SelectItem>
                              <SelectItem value="bounce">Bounce</SelectItem>
                              <SelectItem value="flip">Flip</SelectItem>
                              <SelectItem value="ping">Ping</SelectItem>
                              <SelectItem value="fill">Fill</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </TabsContent>
              </Tabs>

              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : "Save Changes"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
      <div className="text-sm text-muted-foreground mt-6 space-y-2">
        <p>
          <strong>Logo:</strong> Square images work best, PNG format recommended
          for transparency, max 5MB
        </p>
        <p>
          <strong>Backgrounds:</strong> High-quality images, 375x225px or
          larger, PNG or JPEG format, max 5MB
        </p>
        <p>
          Background images will be automatically scaled and positioned to fit
          the card. Logo uploads will delete any existing PWA app icons and
          splash screens.
        </p>
      </div>
    </div>
  );
}
