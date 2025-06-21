import "./globals.css";


import { cn, ThemeProvider, CustomThemeProvider, ModeToggle } from "@eq-ex/ui";
import { Inter } from "next/font/google";

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
            {children}
            <ModeToggle className="fixed bottom-2 left-2 z-50" />
          </CustomThemeProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
