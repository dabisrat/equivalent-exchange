import { SiteHeader } from "@app/components/site-header";
import "./globals.css";
import { CustomThemeProvider } from "@eq-ex/ui/providers/custom-theme-provider";
import { ThemeProvider } from "@eq-ex/ui/providers/theme-provider";
import { cn } from "@eq-ex/ui/utils/cn";
import { Inter } from "next/font/google";
import { AuthProvider } from "@eq-ex/auth";
import { headers } from "next/headers";
import { getOrganizationBySubdomain } from "@app/utils/organization";
import { SubdomainErrorPage } from "@app/components/subdomain-error-page";
import { OrganizationProvider } from "@app/contexts/organization-context";

const fontSans = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata = {
  title: "EQ/EX",
  description: "change it up",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Get subdomain from middleware headers
  const headersList = await headers();
  const subdomain = headersList.get("x-subdomain") || "www";

  // Fetch organization data based on subdomain
  const organizationResult = await getOrganizationBySubdomain(subdomain);

  // Handle organization errors (show error page instead of normal app)
  if (!organizationResult.success && subdomain !== "www") {
    const errorPageTitle = `Organization Error | EQ/EX`;

    return (
      <html lang="en" suppressHydrationWarning>
        <head>
          <title>{errorPageTitle}</title>
          <meta name="robots" content="noindex, nofollow" />
          <meta
            name="description"
            content={`Error loading organization at ${subdomain}.yourdomain.com: ${organizationResult.message}`}
          />
        </head>
        <body className={cn(fontSans.variable)}>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <SubdomainErrorPage
              error={organizationResult.error}
              subdomain={organizationResult.subdomain}
              message={organizationResult.message}
            />
          </ThemeProvider>
        </body>
      </html>
    );
  }

  // Normal app rendering with organization data
  const organizationData = organizationResult.success
    ? organizationResult.data
    : null;

  // Dynamic page title based on organization
  const pageTitle = organizationData?.organization_name
    ? `${organizationData.organization_name} | EQ/EX`
    : "EQ/EX";
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Organization meta tags for client-side access */}
        {organizationData && (
          <>
            <meta name="organization-id" content={organizationData.id} />
            <meta
              name="organization-name"
              content={organizationData.organization_name}
            />
            <meta
              name="organization-subdomain"
              content={organizationData.subdomain}
            />
            <meta
              name="organization-primary-color"
              content={organizationData.primary_color}
            />
            <meta
              name="organization-secondary-color"
              content={organizationData.secondary_color}
            />
            <meta
              name="organization-logo-url"
              content={organizationData.logo_url || ""}
            />
          </>
        )}
        <title>{pageTitle}</title>

        {/* Dynamic CSS custom properties for organization branding */}
        {organizationData && (
          <style
            dangerouslySetInnerHTML={{
              __html: `
              :root {
                --org-primary: ${organizationData.primary_color};
                --org-secondary: ${organizationData.secondary_color};
                --primary: ${organizationData.primary_color};
                --secondary: ${organizationData.secondary_color};
                --sidebar-primary: ${organizationData.primary_color};
                --ring: ${organizationData.primary_color};
                --chart-1: ${organizationData.primary_color};
                --accent: ${organizationData.secondary_color};
              }
              .dark {
                --primary: ${organizationData.primary_color};
                --secondary: ${organizationData.secondary_color};
                --sidebar-primary: ${organizationData.primary_color};
                --ring: ${organizationData.primary_color};
                --chart-1: ${organizationData.primary_color};
                --accent: ${organizationData.secondary_color};
              }
            `,
            }}
          />
        )}
      </head>
      <body className={cn(fontSans.variable)}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <CustomThemeProvider defaultTheme="system">
            <AuthProvider>
              <OrganizationProvider organization={organizationData}>
                <SiteHeader />
                {children}
              </OrganizationProvider>
            </AuthProvider>
          </CustomThemeProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
