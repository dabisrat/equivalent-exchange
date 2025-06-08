"use client";
import { createClient } from "@eq-ex/app/utils/supabase/client";
import { Auth } from "@supabase/auth-ui-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { authUiConfig } from "@eq-ex/app/utils/supabase/auth-ui-config";

export default function PasswordUpdate({ children }: any) {
  const client = createClient();
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
