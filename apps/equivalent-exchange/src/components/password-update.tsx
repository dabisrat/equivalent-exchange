"use client";
import { createBrowserClient } from "@eq-ex/shared";
import { Auth } from "@supabase/auth-ui-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { authUiConfig } from "@eq-ex/shared";

export default function PasswordUpdate({ children }: any) {
  const client = createBrowserClient();
  const router = useRouter();

  useEffect(() => {
    const {
      data: { subscription },
    } = client.auth.onAuthStateChange((event, session) => {
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
    <>
      {children}
      <Auth
        supabaseClient={client}
        view="update_password"
        appearance={authUiConfig}
      />
    </>
  );
}
