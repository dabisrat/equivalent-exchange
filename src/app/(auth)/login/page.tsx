"use client";
import { createClient } from "@PNN/utils/supabase/client";
import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

const getUrl = () => {
  if (typeof window !== "undefined") {
    return window.location.origin;
  } else {
    return "http://localhost:3000/";
  }
};

export default function Login() {
  const client = createClient();
  const router = useRouter();

  useEffect(() => {
    const {
      data: { subscription },
    } = client.auth.onAuthStateChange((event, session) => {
      if (session && (event === "SIGNED_IN" || event === "INITIAL_SESSION")) {
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
      redirectTo={`${getUrl()}/callback`}
      magicLink
      theme="dark"
      otpType="email"
      providers={["google"]}
      queryParams={{
        access_type: "offline",
        prompt: "consent",
      }}
    />
  );
}
