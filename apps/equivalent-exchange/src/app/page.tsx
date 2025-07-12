"use client";

import { createRewardCard, getRewardsCardId } from "@app/utils/data-access";
import { redirect } from "next/navigation";
import { useOrganization } from "@app/contexts/organization-context";
import { useAuth } from "@eq-ex/auth";
import { useEffect, useCallback, useRef } from "react";
import { Skeleton } from "@eq-ex/ui/components/skeleton";

export default function App() {
  const { user, loading } = useAuth();
  const { organization } = useOrganization();
  const isProcessingRef = useRef(false);

  const handleCardRedirect = useCallback(async () => {
    if (!user || !organization || isProcessingRef.current) return;

    isProcessingRef.current = true;

    const cardData = await getRewardsCardId(organization.id, user.id).catch(
      () => null
    );

    if (cardData) {
      // User has a card, redirect to it
      redirect(`/${organization.id}/${cardData.id}`);
    } else {
      // User doesn't have a card, create one
      await createRewardCard(user.id, organization.id).catch((error) => {
        console.error("Error creating card:", error);
        isProcessingRef.current = false; // Reset on error
      });
    }
  }, [user, organization]);

  useEffect(() => {
    // Check if user has a card for this organization and handle redirect
    handleCardRedirect();
  }, [user, organization, handleCardRedirect]);

  if (!user && !loading) {
    redirect(`/auth/login`);
  }

  if (loading || !organization) {
    return (
      <div className="flex flex-col space-y-3 justify-center items-center">
        <Skeleton className="w-[375px] h-[225px] rounded-md" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-[250px]" />
          <Skeleton className="h-4 w-[200px]" />
        </div>
        <div className="text-center">
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }
}
