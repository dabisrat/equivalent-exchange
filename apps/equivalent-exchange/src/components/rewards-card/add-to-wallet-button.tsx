"use client";

import { generateGoogleWalletPass } from "@app/data-access/actions/generate-google-pass";
import { useState } from "react";
import { toast } from "sonner";
import Image from "next/image";

interface AddToWalletButtonProps {
  cardId: string;
}

export function AddToWalletButton({ cardId }: AddToWalletButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleAddToWallet = async () => {
    setIsLoading(true);
    try {
      const result = await generateGoogleWalletPass({
        cardId,
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
    <button
      onClick={handleAddToWallet}
      disabled={isLoading}
      className="relative inline-block"
      style={{
        cursor: isLoading ? "not-allowed" : "pointer",
        opacity: isLoading ? 0.5 : 1,
      }}
    >
      <Image
        src="/google_wallet_condensed.svg"
        alt="Add to Google Wallet"
        width={199}
        height={55}
        className="h-12 w-auto"
      />
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-lg">
          <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
        </div>
      )}
    </button>
  );
}
