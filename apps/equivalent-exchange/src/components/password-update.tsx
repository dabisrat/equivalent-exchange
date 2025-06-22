"use client";
import { authUiConfig, createBrowserClient } from "@eq-ex/shared";
import { Auth } from "@supabase/auth-ui-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { AuthCard } from "@eq-ex/ui/components/auth-card";

export default function PasswordUpdate({ children }: any) {
  const client = createBrowserClient();
  const router = useRouter();

  useEffect(() => {
    const {
      data: { subscription },
    } = client.auth.onAuthStateChange((event, session) => {
      debugger;
      if (!session) {
        router.replace("/login");
      }

      if (event === "USER_UPDATED") {
        router.replace("/");
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  return (
    <AuthCard
      title="Update Password"
      description="Please enter a new password for your account."
    >
      {children}
      <Auth
        supabaseClient={client}
        view="update_password"
        appearance={authUiConfig}
      />
    </AuthCard>
  );
}
