"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { PasskeyRegistration } from "@eq-ex/auth";
import { Button } from "@eq-ex/ui/components/button";

export function PasskeySetupWrapper() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirectTo") || "/";

  const handleSkip = () => {
    router.push(redirectTo);
  };

  return (
    <div className="space-y-4">
      <PasskeyRegistration onSuccess={() => router.push(redirectTo)} />
      <div className="text-center">
        <Button variant="outline" className="w-full" onClick={handleSkip}>
          Skip for now
        </Button>
      </div>
    </div>
  );
}
