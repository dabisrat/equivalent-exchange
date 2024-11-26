import "./globals.css";

import { Inter } from "next/font/google";
import { cn } from "@PNN/utils/shadcn/utils";

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
      <body className={cn(fontSans.variable)}>{children}</body>
    </html>
  );
}
