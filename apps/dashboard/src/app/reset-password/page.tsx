"use client";

import { Auth } from "@supabase/auth-ui-react";
import { createBrowserClient, authUiConfig } from "@eq-ex/shared";
import { AuthCard } from "@eq-ex/ui/components/auth-card";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function ResetPasswordPage() {
  const supabase = createBrowserClient();
  const router = useRouter();

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "USER_UPDATED") {
        router.replace("/dashboard");
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  return (
    <AuthCard
      title="Reset Password"
      description="Enter your email to receive a password reset link"
    >
      <Auth
        supabaseClient={supabase}
        showLinks={false}
        magicLink={false}
        appearance={authUiConfig}
        view="update_password"
      />
    </AuthCard>
  );
}
