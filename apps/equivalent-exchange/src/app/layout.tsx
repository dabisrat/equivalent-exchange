import { SiteHeader } from "@app/components/site-header";
import "./globals.css";
import { ModeToggle } from "@eq-ex/ui/components/theme-toggle";
import { CustomThemeProvider } from "@eq-ex/ui/providers/custom-theme-provider";
import { ThemeProvider } from "@eq-ex/ui/providers/theme-provider";
import { cn } from "@eq-ex/ui/utils/cn";
import { Inter } from "next/font/google";
import { AuthProvider } from "@eq-ex/auth";

const fontSans = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata = {
  title: "EQ/EX",
  description: "change it up",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={cn(fontSans.variable)}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <CustomThemeProvider defaultTheme="system">
            <AuthProvider>
              <SiteHeader />
              {children}
            </AuthProvider>
          </CustomThemeProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
