"use client";
import { createClient } from "@PNN/utils/supabase/client";
import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Authentication() {
  const client = createClient();
  const router = useRouter();
  useEffect(() => {
    const {
      data: { subscription },
    } = client.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN") {
        router.replace("/");
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  return (
    <Auth
      supabaseClient={client}
      appearance={{
        theme: ThemeSupa,
        style: {
          container: {
            padding: "1rem",
          },
        },
      }}
      socialLayout="horizontal"
      redirectTo={`${location.origin}/auth/callback`}
      theme="dark"
      otpType="email"
      providers={["google" /*"apple", "facebook"*/]}
      queryParams={{
        access_type: "offline",
        prompt: "consent",
      }}
    />
  );
}
