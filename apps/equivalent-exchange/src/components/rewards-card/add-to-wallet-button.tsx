"use client";

import { generateGoogleWalletPass } from "@app/data-access/actions/generate-google-pass";
import { useState } from "react";
import { toast } from "sonner";
import WalletButtonSvg from "../../assests/google_wallet_condensed.svg";

interface AddToWalletButtonProps {
  cardId: string;
  organizationId: string;
}

export function AddToWalletButton({
  cardId,
  organizationId,
}: AddToWalletButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleAddToWallet = async () => {
    setIsLoading(true);
    try {
      const result = await generateGoogleWalletPass({
        cardId,
        organizationId,
      });

      if (result.success) {
        // Redirect to Google Wallet save URL
        window.location.href = result.data;
      } else {
        toast.error(result.error || "Failed to add to wallet");
      }
    } catch (error) {
      console.error("Error adding to wallet:", error);
      toast.error("Failed to add to wallet");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    // Fixed bottom-center so the wallet button appears at the bottom of the page
    <div
      className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 inline-block"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div
        dangerouslySetInnerHTML={{ __html: WalletButtonSvg }}
        onClick={isLoading ? undefined : handleAddToWallet}
        style={{
          cursor: isLoading ? "not-allowed" : "pointer",
          opacity: isLoading ? 0.5 : 1,
        }}
        className="transition-opacity duration-200"
      />
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-[24.5px]">
          <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
}
