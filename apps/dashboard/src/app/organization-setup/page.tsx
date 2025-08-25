"use client";

import React, { useRef, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@eq-ex/ui/components/button";
import { Card } from "@eq-ex/ui/components/card";
import { Input } from "@eq-ex/ui/components/input";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@eq-ex/ui/components/form";
import { createOrganization as createOrganizationAction } from "@app/data-access/actions/organizations";
import { useAuth } from "@app/hooks/use-auth";
import { ModeToggle } from "@eq-ex/ui/components/theme-toggle";
import { LogOut } from "lucide-react";
import { signOut } from "@eq-ex/auth";
import {
  createOrganizationSchema,
  MAX_POINTS,
  type CreateOrganizationInput,
} from "@app/schemas/organization";

export default function OrganizationSetupPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [isCheckingSubdomain, setIsCheckingSubdomain] = useState(false);
  const [subdomainAvailable, setSubdomainAvailable] = useState<boolean | null>(
    null
  );
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const form = useForm({
    resolver: zodResolver(createOrganizationSchema),
    mode: "onBlur",
    defaultValues: {
      organization_name: "",
      max_points: 10,
      subdomain: "",
      primary_color: "#3b82f6",
      secondary_color: "#64748b",
      logo_url: "",
    },
  });

  // Watch subdomain changes for validation
  const watchedSubdomain = form.watch("subdomain");

  // Debounced subdomain checking
  const checkSubdomainAvailability = async (subdomain: string) => {
    if (!subdomain || subdomain.length < 3) {
      setSubdomainAvailable(null);
      return;
    }

    setIsCheckingSubdomain(true);
    try {
      const response = await fetch("/api/organization/check-subdomain", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ subdomain }),
      });

      const result = await response.json();
      setSubdomainAvailable(result.available);
    } catch (error) {
      console.error("Error checking subdomain:", error);
      setSubdomainAvailable(null);
    } finally {
      setIsCheckingSubdomain(false);
    }
  };

  // Effect to handle subdomain checking
  useEffect(() => {
    if (watchedSubdomain) {
      // Clear existing timeout
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }

      // Set new timeout
      debounceTimeoutRef.current = setTimeout(() => {
        checkSubdomainAvailability(watchedSubdomain);
      }, 500);
    } else {
      setSubdomainAvailable(null);
    }

    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [watchedSubdomain]);

  const onSubmit = async (data: CreateOrganizationInput) => {
    if (!user?.email) {
      form.setError("root", { message: "User email not found" });
      return;
    }

    if (data.subdomain && subdomainAvailable === false) {
      form.setError("subdomain", {
        message: "Please choose an available subdomain",
      });
      return;
    }

    try {
      // Transform form data to match CreateOrganizationInput
      const organizationData: CreateOrganizationInput = {
        organization_name: data.organization_name,
        max_points: data.max_points,
        subdomain: data.subdomain,
        primary_color: data.primary_color,
        secondary_color: data.secondary_color,
        logo_url: data.logo_url || undefined,
      };

      const result = await createOrganizationAction(organizationData);

      if (result.success) {
        // Redirect to dashboard after successful setup
        router.push("/dashboard");
      } else {
        form.setError("root", { message: result.message });
      }
    } catch (err) {
      console.error("Failed to create organization:", err);
      form.setError("root", {
        message: "Failed to create organization. Please try again.",
      });
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut("/login");
    } catch (error) {
      console.error("Failed to sign out:", error);
    }
  };

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-2 h-14 flex items-center justify-between">
          <div className="mr-4">
            <h1 className="text-lg font-semibold">Dashboard</h1>
          </div>
          <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
            <ModeToggle />
            {user && (
              <Button variant="ghost" onClick={handleSignOut} className="gap-2">
                <LogOut className="h-4 w-4" />
                Logout
              </Button>
            )}
          </div>
        </div>
      </header>

      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
        <div className="w-full max-w-md">
          <Card className="p-6">
            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                Organization Setup
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                Set up your organization to get started
              </p>
            </div>

            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4"
              >
                <FormItem>
                  <FormLabel className="text-sm font-medium">Email</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      value={user?.email || ""}
                      disabled
                      className="bg-gray-100 dark:bg-gray-800"
                    />
                  </FormControl>
                  <FormDescription className="text-xs text-gray-500">
                    This email will be associated with your organization
                  </FormDescription>
                </FormItem>

                <FormField
                  control={form.control}
                  name="organization_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">
                        Organization Name{" "}
                        <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter your organization name"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="subdomain"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">
                        Subdomain <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            placeholder="mycompany"
                            className="pr-32"
                            {...field}
                            onChange={(e) => {
                              field.onChange(e.target.value.toLowerCase());
                            }}
                          />
                          <div className="absolute right-2 top-1/2 transform -translate-y-1/2 text-xs text-gray-500">
                            {field.value || "your-domain"}.eqxrewards.com
                          </div>
                        </div>
                      </FormControl>
                      {isCheckingSubdomain && (
                        <FormDescription className="text-xs text-gray-500">
                          Checking availability...
                        </FormDescription>
                      )}
                      {subdomainAvailable === true && field.value && (
                        <FormDescription className="text-xs text-green-600">
                          ✓ Subdomain is available
                        </FormDescription>
                      )}
                      {subdomainAvailable === false && field.value && (
                        <FormDescription className="text-xs text-red-600">
                          ✗ Subdomain is already taken
                        </FormDescription>
                      )}
                      <FormDescription className="text-xs text-gray-500">
                        Your organization will be accessible at{" "}
                        {field.value || "your-domain"}.eqxrewards.com
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="max_points"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">
                        Maximum Points <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="10"
                          min="1"
                          max={MAX_POINTS}
                          {...field}
                          onChange={(e) =>
                            field.onChange(parseInt(e.target.value) || 0)
                          }
                        />
                      </FormControl>
                      <FormDescription className="text-xs text-gray-500">
                        Maximum points that can be awarded
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="logo_url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">
                        Logo URL (Optional)
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="url"
                          placeholder="https://example.com/logo.png"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription className="text-xs text-gray-500">
                        URL to your organization&apos;s logo image
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {form.formState.errors.root && (
                  <div className="text-red-600 dark:text-red-400 text-sm text-center">
                    {form.formState.errors.root.message}
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full"
                  disabled={form.formState.isSubmitting}
                >
                  {form.formState.isSubmitting
                    ? "Creating Organization..."
                    : "Create Organization"}
                </Button>
              </form>
            </Form>

            <div className="mt-4 text-center">
              <p className="text-xs text-gray-500">
                <span className="text-red-500">*</span> Required fields
              </p>
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}
