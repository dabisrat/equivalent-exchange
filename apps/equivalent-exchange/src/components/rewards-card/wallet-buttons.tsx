"use client";

import { useState, useEffect } from "react";
import { AddToWalletButton } from "./add-to-wallet-button";
import { AddToAppleWalletButton } from "./add-to-apple-wallet-button";

interface WalletButtonsProps {
  cardId: string;
}

/**
 * Unified wallet buttons component that detects platform and shows appropriate button(s)
 * - iOS Safari: Shows Apple Wallet button only
 * - Android: Shows Google Wallet button only
 * - Desktop/Other: Shows both buttons
 */
export function WalletButtons({ cardId }: WalletButtonsProps) {
  const [platform, setPlatform] = useState<"ios" | "android" | "other">(
    "other"
  );

  useEffect(() => {
    // Detect platform on mount
    const userAgent = navigator.userAgent.toLowerCase();

    if (/iphone|ipad|ipod/.test(userAgent)) {
      setPlatform("ios");
    } else if (/android/.test(userAgent)) {
      setPlatform("android");
    } else {
      setPlatform("other");
    }
  }, []);

  return (
    <div className="flex flex-col sm:flex-row gap-4 items-center justify-center">
      {(platform === "ios" || platform === "other") && (
        <AddToAppleWalletButton cardId={cardId} />
      )}
      {(platform === "android" || platform === "other") && (
        <AddToWalletButton cardId={cardId} />
      )}
    </div>
  );
}
