"use client";

import { generateAppleWalletPass } from "@app/data-access/actions/generate-apple-pass";
import { useState } from "react";
import { toast } from "sonner";
import Image from "next/image";

interface AddToAppleWalletButtonProps {
  cardId: string;
}

export function AddToAppleWalletButton({
  cardId,
}: AddToAppleWalletButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleAddToWallet = async () => {
    setIsLoading(true);
    try {
      const result = await generateAppleWalletPass({
        cardId,
      });

      if (result.success && result.data) {
        // Create a blob from the buffer and trigger download
        const blob = new Blob([new Uint8Array(result.data)], {
          type: "application/vnd.apple.pkpass",
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `reward-card-${cardId}.pkpass`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        toast.success("Pass downloaded! Tap the file to add to Apple Wallet");
      } else {
        toast.error(
          (result as { success: false; error: string }).error ||
            "Failed to add to wallet"
        );
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
        src="/apple_wallet.svg"
        alt="Add to Apple Wallet"
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
