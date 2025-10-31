"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardFooter } from "@eq-ex/ui/components/card";
import { Skeleton } from "@eq-ex/ui/components/skeleton";
import QRCode from "qrcode";

interface PreviewWalletPassProps {
  className?: string;
  programName?: string;
  hexBackgroundColor?: string;
  programLogoUrl?: string;
  heroImageUrl?: string;
  issuerName?: string;
}

// Utility function to determine if a hex color is dark
function isDarkColor(hexColor: string): boolean {
  // Remove # if present
  const hex = hexColor.replace("#", "");

  // Convert hex to RGB
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);

  // Calculate luminance (perceived brightness)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

  // Return true if dark (luminance < 0.5)
  return luminance < 0.5;
}

// Get appropriate text color based on background
function getTextColor(hexBackgroundColor: string): string {
  return isDarkColor(hexBackgroundColor) ? "text-white" : "text-black";
}

export function PreviewWalletPass({
  className,
  programName = "My Rewards Program",
  hexBackgroundColor = "#ffffff",
  programLogoUrl,
  heroImageUrl,
  issuerName = "Organization Name",
}: PreviewWalletPassProps) {
  const [barcodeDataUrl, setBarcodeDataUrl] = useState<string>("");

  useEffect(() => {
    // Generate QR code for preview
    QRCode.toDataURL("https://example.com/pass", {
      width: 150,
      margin: 1,
    })
      .then((url) => setBarcodeDataUrl(url))
      .catch((err) => console.error("QR Code generation failed", err));
  }, []);

  // Determine text color based on background
  const textColor = getTextColor(hexBackgroundColor);

  // Show loading if QR not ready
  if (!barcodeDataUrl) {
    return (
      <Card className={className}>
        <CardContent className="p-4">
          <Skeleton className="h-48 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className} style={{ backgroundColor: hexBackgroundColor }}>
      <CardContent className="p-4 flex flex-col h-full">
        {/* Top 2/3 Content */}
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <div className="flex items-center gap-3 mb-4">
            {programLogoUrl && (
              <img
                src={programLogoUrl}
                alt="Logo"
                width={32}
                height={32}
                className="rounded-full"
              />
            )}
            <div>
              <h2 className={textColor}>{issuerName}</h2>
            </div>
          </div>

          {/* Program Name */}
          <div className="flex justify-center mb-4">
            <h1 className={`text-2xl ${textColor}`}>{programName}</h1>
          </div>

          {/* Points */}
          <div className="flex items-start">
            <div className="flex-1">
              <div className={`text-left text-sm ${textColor}`}>Stamps</div>
              <div className={`text-left text-lg font-medium ${textColor}`}>
                10/10
              </div>
            </div>
          </div>

          {/* Barcode */}
          <div className="mx-4 flex-1 flex items-center justify-center">
            <div className="text-center">
              <img
                src={barcodeDataUrl}
                alt="QR Code"
                width={150}
                height={150}
                className="rounded"
              />
              <div className={`text-xs mt-1 ${textColor}`}>Member ID</div>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="p-0">
        {/* Hero Image - Bottom 1/3 */}
        <div className="h-1/3 w-full">
          {heroImageUrl && (
            <img
              src={heroImageUrl}
              alt="Hero"
              className="w-full h-full object-cover rounded-b-2xl"
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />
          )}
        </div>
      </CardFooter>
    </Card>
  );
}
