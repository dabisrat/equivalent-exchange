"use client";

import { createRewardCard, getRewardsCardId } from "@app/utils/data-access";
import { redirect } from "next/navigation";
import { useOrganization } from "@app/contexts/organization-context";
import { useAuth } from "@eq-ex/auth";
import { useEffect, useCallback } from "react";

export default function App() {
  const { user, loading } = useAuth();
  const { organization } = useOrganization();

  const handleCardRedirect = useCallback(async () => {
    if (!user || !organization) return;

    try {
      const cardData = await getRewardsCardId(organization.id, user.id);
      // User has a card, redirect to it
      redirect(`/${organization.id}/${cardData.id}`);
    } catch (error) {
      // User doesn't have a card, create one
      try {
        await createRewardCard(user.id, organization.id);
        // createRewardCard should handle the redirect
      } catch (createError) {
        console.error("Error creating card:", createError);
      }
    }
  }, [user, organization]);
  useEffect(() => {
    if (loading || !user || !organization) return;

    if (!user) {
      redirect(`/auth/login`);
      return;
    }

    // Check if user has a card for this organization and handle redirect
    handleCardRedirect();
  }, [user, loading, organization, handleCardRedirect]);

  // Show loading state while auth or organization data is loading
  if (loading || !organization) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }
}
