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
import { generateThemeCSS } from "@app/utils/color-utils";
import { IOSInstallPrompt } from "@app/components/ios-install-prompt";

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
        {/* PWA meta tags */}
        <meta name="application-name" content="EQ/EX" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="EQ/EX" />
        <meta name="description" content="Change it up with EQ/EX" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-config" content="/icons/browserconfig.xml" />
        <meta name="msapplication-TileColor" content="#2B5797" />
        <meta name="msapplication-tap-highlight" content="no" />
        <meta name="theme-color" content="#000000" />

        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <link
          rel="apple-touch-icon"
          sizes="152x152"
          href="/icons/icon-152x152.png"
        />
        <link
          rel="apple-touch-icon"
          sizes="180x180"
          href="/icons/icon-192x192.png"
        />
        <link
          rel="apple-touch-icon"
          sizes="167x167"
          href="/icons/icon-192x192.png"
        />

        <link
          rel="icon"
          type="image/png"
          sizes="32x32"
          href="/icons/icon-32x32.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="16x16"
          href="/icons/icon-16x16.png"
        />
        <link rel="manifest" href="/manifest.json" />
        <link
          rel="mask-icon"
          href="/icons/safari-pinned-tab.svg"
          color="#5bbad5"
        />
        <link rel="shortcut icon" href="/favicon.ico" />

        <meta name="twitter:card" content="summary" />
        <meta name="twitter:url" content="https://yourdomain.com" />
        <meta name="twitter:title" content="EQ/EX" />
        <meta name="twitter:description" content="Change it up with EQ/EX" />
        <meta
          name="twitter:image"
          content="https://yourdomain.com/icons/icon-192x192.png"
        />
        <meta name="twitter:creator" content="@eq_ex" />
        <meta property="og:type" content="website" />
        <meta property="og:title" content="EQ/EX" />
        <meta property="og:description" content="Change it up with EQ/EX" />
        <meta property="og:site_name" content="EQ/EX" />
        <meta property="og:url" content="https://yourdomain.com" />
        <meta
          property="og:image"
          content="https://yourdomain.com/icons/icon-192x192.png"
        />

        {/* Organization meta tags for client-side access */}
        {organizationData && (
          <>
            <meta name="organization-id" content={organizationData.id} />
            <meta
              name="organization-name"
              content={organizationData.organization_name ?? ""}
            />
            <meta
              name="organization-subdomain"
              content={organizationData.subdomain ?? ""}
            />
            <meta
              name="organization-primary-color"
              content={organizationData.primary_color || ""}
            />
            <meta
              name="organization-secondary-color"
              content={organizationData.secondary_color || ""}
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
              __html: generateThemeCSS(
                organizationData.primary_color || "",
                "neutral"
              ),
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
                <IOSInstallPrompt />
              </OrganizationProvider>
            </AuthProvider>
          </CustomThemeProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
