"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@eq-ex/ui/components/button";
import { Card } from "@eq-ex/ui/components/card";
import { Input } from "@eq-ex/ui/components/input";
import { Label } from "@eq-ex/ui/components/label";
import { createOrganization } from "@app/utils/organization";
import { useAuth } from "@app/hooks/use-auth";
import { ModeToggle } from "@eq-ex/ui/components/theme-toggle";
import { LogOut } from "lucide-react";
import { signOut } from "@eq-ex/auth";

export default function OrganizationSetupPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingSubdomain, setIsCheckingSubdomain] = useState(false);
  const [subdomainAvailable, setSubdomainAvailable] = useState<boolean | null>(
    null
  );
  const [formData, setFormData] = useState({
    organization_name: "",
    max_points: 100,
    subdomain: "",
    primary_color: "#3b82f6",
    secondary_color: "#64748b",
    logo_url: "",
  });
  const [error, setError] = useState<string>("");

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user?.email) {
      setError("User email not found");
      return;
    }

    if (!formData.organization_name.trim()) {
      setError("Organization name is required");
      return;
    }

    if (formData.max_points <= 0) {
      setError("Max points must be greater than 0");
      return;
    }

    if (formData.subdomain && subdomainAvailable === false) {
      setError("Please choose an available subdomain");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      await createOrganization({
        organization_name: formData.organization_name.trim(),
        max_points: formData.max_points,
        subdomain: formData.subdomain || undefined,
        primary_color: formData.primary_color,
        secondary_color: formData.secondary_color,
        logo_url: formData.logo_url || undefined,
      });

      // Redirect to dashboard after successful setup
      router.push("/dashboard");
    } catch (err) {
      console.error("Failed to create organization:", err);
      setError("Failed to create organization. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string | number) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Check subdomain availability when subdomain changes
    if (field === "subdomain" && typeof value === "string") {
      // Debounce the subdomain check
      const timeoutId = setTimeout(() => {
        checkSubdomainAvailability(value);
      }, 500);

      return () => clearTimeout(timeoutId);
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
    // TODO: use shadcn form with react-hook-form for better form handling
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

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="email" className="text-sm font-medium">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={user?.email || ""}
                  disabled
                  className="mt-1 bg-gray-100 dark:bg-gray-800"
                />
                <p className="text-xs text-gray-500 mt-1">
                  This email will be associated with your organization
                </p>
              </div>

              <div>
                <Label
                  htmlFor="organization_name"
                  className="text-sm font-medium"
                >
                  Organization Name *
                </Label>
                <Input
                  id="organization_name"
                  type="text"
                  value={formData.organization_name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    handleInputChange("organization_name", e.target.value)
                  }
                  placeholder="Enter your organization name"
                  className="mt-1"
                  required
                />
              </div>

              <div>
                <Label htmlFor="subdomain" className="text-sm font-medium">
                  Subdomain (Optional)
                </Label>
                <div className="mt-1 relative">
                  <Input
                    id="subdomain"
                    type="text"
                    value={formData.subdomain}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      handleInputChange(
                        "subdomain",
                        e.target.value.toLowerCase()
                      )
                    }
                    placeholder="mycompany"
                    className="pr-20"
                  />
                  <div className="absolute right-2 top-1/2 transform -translate-y-1/2 text-xs text-gray-500">
                    .yourdomain.com
                  </div>
                </div>
                {isCheckingSubdomain && (
                  <p className="text-xs text-gray-500 mt-1">
                    Checking availability...
                  </p>
                )}
                {subdomainAvailable === true && formData.subdomain && (
                  <p className="text-xs text-green-600 mt-1">
                    ✓ Subdomain is available
                  </p>
                )}
                {subdomainAvailable === false && formData.subdomain && (
                  <p className="text-xs text-red-600 mt-1">
                    ✗ Subdomain is already taken
                  </p>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  Your organization will be accessible at
                  subdomain.yourdomain.com
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label
                    htmlFor="primary_color"
                    className="text-sm font-medium"
                  >
                    Primary Color
                  </Label>
                  <div className="mt-1 flex items-center space-x-2">
                    <Input
                      id="primary_color"
                      type="color"
                      value={formData.primary_color}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        handleInputChange("primary_color", e.target.value)
                      }
                      className="w-12 h-10 p-1 border-2"
                    />
                    <Input
                      type="text"
                      value={formData.primary_color}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        handleInputChange("primary_color", e.target.value)
                      }
                      placeholder="#3b82f6"
                      className="flex-1"
                    />
                  </div>
                </div>

                <div>
                  <Label
                    htmlFor="secondary_color"
                    className="text-sm font-medium"
                  >
                    Secondary Color
                  </Label>
                  <div className="mt-1 flex items-center space-x-2">
                    <Input
                      id="secondary_color"
                      type="color"
                      value={formData.secondary_color}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        handleInputChange("secondary_color", e.target.value)
                      }
                      className="w-12 h-10 p-1 border-2"
                    />
                    <Input
                      type="text"
                      value={formData.secondary_color}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        handleInputChange("secondary_color", e.target.value)
                      }
                      placeholder="#64748b"
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>

              <div>
                <Label htmlFor="logo_url" className="text-sm font-medium">
                  Logo URL (Optional)
                </Label>
                <Input
                  id="logo_url"
                  type="url"
                  value={formData.logo_url}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    handleInputChange("logo_url", e.target.value)
                  }
                  placeholder="https://example.com/logo.png"
                  className="mt-1"
                />
                <p className="text-xs text-gray-500 mt-1">
                  URL to your organization&apos;s logo image
                </p>
              </div>

              <div>
                <Label htmlFor="max_points" className="text-sm font-medium">
                  Maximum Points *
                </Label>
                <Input
                  id="max_points"
                  type="number"
                  value={formData.max_points}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    handleInputChange(
                      "max_points",
                      parseInt(e.target.value) || 0
                    )
                  }
                  placeholder="100"
                  min="1"
                  className="mt-1"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Maximum points that can be awarded
                </p>
              </div>

              {error && (
                <div className="text-red-600 dark:text-red-400 text-sm text-center">
                  {error}
                </div>
              )}

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Creating Organization..." : "Create Organization"}
              </Button>
            </form>

            <div className="mt-4 text-center">
              <p className="text-xs text-gray-500">* Required fields</p>
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}
