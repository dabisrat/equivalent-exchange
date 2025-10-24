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
import ServiceWorkerRegistration from "@app/components/ServiceWorkerRegistration";
import { Toaster } from "@eq-ex/ui/components/sonner";

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
  const headersList = await headers();
  const host = headersList.get("host") || "";
  const parts = host.split(".");
  const subdomainFromHost = parts.length > 2 ? parts[0] : "www";
  const subdomain = headersList.get("x-subdomain") || subdomainFromHost;

  // Fetch organization data based on subdomain
  const organizationResult = await getOrganizationBySubdomain(subdomain);

  // Handle organization errors (show error page instead of normal app)
  if (!organizationResult.success) {
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

  // Dynamic PWA branding
  const appName = organizationData?.organization_name
    ? `${organizationData.organization_name} Rewards`
    : "EQ/EX";
  const appShortName = organizationData?.organization_name
    ? organizationData.organization_name.length > 12
      ? organizationData.organization_name.substring(0, 12)
      : organizationData.organization_name
    : "EQ/EX";
  const appDescription = organizationData?.organization_name
    ? `${organizationData.organization_name} rewards program - powered by Equivalent Exchange`
    : "Change it up with EQ/EX";
  const themeColor = organizationData?.primary_color || "#000000";

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* <script
          async
          crossOrigin="anonymous"
          src="https://tweakcn.com/live-preview.min.js"
        /> */}
        {/* PWA meta tags */}
        <meta name="application-name" content={appName} />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content={appShortName} />
        <meta name="description" content={appDescription} />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-config" content="/icons/browserconfig.xml" />
        <meta name="msapplication-TileColor" content={themeColor} />
        <meta name="msapplication-tap-highlight" content="no" />
        <meta name="theme-color" content={themeColor} />

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
        <meta name="twitter:title" content={appName} />
        <meta name="twitter:description" content={appDescription} />
        <meta
          name="twitter:image"
          content="https://yourdomain.com/icons/icon-192x192.png"
        />
        <meta name="twitter:creator" content="@eq_ex" />
        <meta property="og:type" content="website" />
        <meta property="og:title" content={appName} />
        <meta property="og:description" content={appDescription} />
        <meta property="og:site_name" content={appName} />
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
              __html: organizationData.card_config?.custom_theme_css
                ? organizationData.card_config.custom_theme_css
                : generateThemeCSS(
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
                <ServiceWorkerRegistration />
                <SiteHeader />
                {children}
                <Toaster />
              </OrganizationProvider>
            </AuthProvider>
          </CustomThemeProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
